import "server-only";

import { generateCard, GenerationError, isDepth, type Depth } from "./ai";
import {
  CardContentSchema,
  IMAGE_LAYOUTS,
  OutlineSchema,
  normalizeCard,
  parseStored,
  type CardBrief,
  type CardContent,
  type CardImage,
} from "./cards";
import { db } from "./db";
import { findPhoto, photoKey } from "./images";
import { NO_RESEARCH, mergeResearch, parseSources, parseTexts, type Research, type Source } from "./research";
import { DEFAULT_MODE, canExportPptx, isModeId, planOf, type ModeId } from "./plans";
import { isCreditsPlace, type CreditsPlace, type DeckLook } from "./slides";
import type { ThemeId } from "./themes";

const BriefSchema = OutlineSchema.shape.cards.element;

export interface CardView {
  id: string;
  position: number;
  status: "pending" | "ready" | "failed";
  brief: CardBrief;
  content: CardContent | null;
}

export interface DeckView {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  theme: string;
  mode: ModeId;
  depth: Depth;
  /** The owner's plan includes PowerPoint download. */
  pptx: boolean;
  /** Anyone with the link can view it. */
  shared: boolean;
  /** Articles the deck's facts come from ([] for non-factual decks). */
  sources: Source[];
  /** Badge, closing slide and photo credits (the badge is always on for Free accounts). */
  look: DeckLook;
  cards: CardView[];
}

function toCardView(row: { id: string; position: number; status: string; brief: string; content: string }): CardView {
  return {
    id: row.id,
    position: row.position,
    status: row.status === "ready" || row.status === "failed" ? row.status : "pending",
    brief: parseStored(BriefSchema, row.brief) ?? { title: "Untitled", points: [] },
    content: parseStored(CardContentSchema, row.content),
  };
}

export async function getDeck(id: string): Promise<DeckView | null> {
  const deck = await db.deck.findUnique({
    where: { id },
    include: { cards: { orderBy: { position: "asc" } }, research: { select: { sources: true } }, user: { select: { plan: true } } },
  });
  if (!deck) return null;
  return {
    id: deck.id,
    userId: deck.userId,
    title: deck.title,
    prompt: deck.prompt,
    theme: deck.theme,
    mode: isModeId(deck.mode) ? deck.mode : DEFAULT_MODE,
    depth: isDepth(deck.depth) ? deck.depth : "medium",
    pptx: canExportPptx(deck.user.plan),
    shared: deck.shared,
    sources: parseSources(deck.research?.sources),
    look: {
      badge: deck.badge || !canRemoveBadge(deck.user.plan),
      endSlide: deck.endSlide,
      credits: isCreditsPlace(deck.credits) ? deck.credits : "slide",
    },
    cards: deck.cards.map(toCardView),
  };
}

export async function createDeck(input: {
  userId: string;
  title: string;
  prompt: string;
  theme: ThemeId;
  mode: ModeId;
  depth?: Depth;
  outline: CardBrief[];
  /** Research saved with the outline (see saveResearch); ignored unless it's this user's. */
  researchId?: string | null;
}): Promise<{ id: string }> {
  const researchId =
    input.researchId && (await db.research.count({ where: { id: input.researchId, userId: input.userId } })) === 1
      ? input.researchId
      : null;
  const deck = await db.deck.create({
    data: {
      userId: input.userId,
      title: input.title,
      prompt: input.prompt,
      theme: input.theme,
      mode: input.mode,
      depth: input.depth ?? "medium",
      researchId,
      cards: {
        create: input.outline.map((brief, position) => ({ position, brief: JSON.stringify(brief) })),
      },
    },
  });
  return { id: deck.id };
}

export async function ownsDeck(userId: string, deckId: string): Promise<boolean> {
  return (await db.deck.count({ where: { id: deckId, userId } })) === 1;
}

export async function ownsCard(userId: string, deckId: string, cardId: string): Promise<boolean> {
  return (await db.card.count({ where: { id: cardId, deckId, deck: { userId } } })) === 1;
}

export async function listDecks(userId: string, take?: number) {
  const decks = await db.deck.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      theme: true,
      shared: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { cards: true } },
      cards: { orderBy: { position: "asc" }, take: 1, select: { content: true } },
    },
  });
  return decks.map((d) => ({
    id: d.id,
    title: d.title,
    theme: d.theme,
    shared: d.shared,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    cards: d._count.cards,
    cover: parseStored(CardContentSchema, d.cards[0]?.content ?? ""),
  }));
}

/** Saves an outline's research so the deck made from it is written and checked against it. */
export async function saveResearch(userId: string, research: Research): Promise<string | null> {
  if (research.sources.length === 0) return null;
  const row = await db.research.create({
    data: { userId, sources: JSON.stringify(research.sources), texts: JSON.stringify(research.webTexts) },
  });
  return row.id;
}

/** Adds pages found while writing a card to the deck's research, so they're listed and reused. */
async function addResearch(deckId: string, found: Research): Promise<void> {
  // Read the latest version: other cards may have added pages meanwhile.
  const deck = await db.deck.findUnique({ where: { id: deckId }, select: { researchId: true } });
  if (!deck?.researchId) return;
  const merged = mergeResearch(await deckResearch(deckId), found);
  await db.research.update({
    where: { id: deck.researchId },
    data: { sources: JSON.stringify(merged.sources), texts: JSON.stringify(merged.webTexts) },
  });
}

async function deckResearch(deckId: string): Promise<Research> {
  const row = await db.deck.findUnique({ where: { id: deckId }, select: { research: true } });
  if (!row?.research) return NO_RESEARCH;
  return { sources: parseSources(row.research.sources), webTexts: parseTexts(row.research.texts) };
}

/** Generates (or regenerates) one card and stores the result. */
// Photos being picked right now, per deck: cards are written in parallel, so two of them
// could otherwise choose the same photo before either is saved.
const reserved = new Map<string, Set<string>>();

/** Photo URLs that other cards of the deck show now (read fresh: other cards may have just saved). */
async function photosInUse(deckId: string, cardId: string): Promise<Set<string>> {
  const rows = await db.card.findMany({ where: { deckId, NOT: { id: cardId } }, select: { content: true } });
  const urls = rows.flatMap((r) => {
    const image = parseStored(CardContentSchema, r.content)?.image;
    return image ? [image.url] : [];
  });
  return new Set([...urls, ...(reserved.get(deckId) ?? [])]);
}

/** Finds a photo no other card of the deck uses, checking again after the search in case one was saved meanwhile. */
async function uniquePhoto(
  deckId: string,
  cardId: string,
  find: (used: ReadonlySet<string>) => Promise<CardImage | null>,
): Promise<CardImage | null> {
  let used = await photosInUse(deckId, cardId);
  for (let attempt = 0; attempt < 3; attempt++) {
    const photo = await find(used);
    if (!photo) return null;
    const now = await photosInUse(deckId, cardId);
    const clash = [...now].some((url) => photoKey(url) === photoKey(photo.url));
    if (!clash) {
      const set = reserved.get(deckId) ?? new Set<string>();
      set.add(photo.url);
      reserved.set(deckId, set);
      // The reservation only has to outlive the save that follows.
      setTimeout(() => set.delete(photo.url), 60_000).unref?.();
      return photo;
    }
    used = new Set([...now, photo.url]);
  }
  return null;
}

export async function generateDeckCard(
  deckId: string,
  cardId: string,
  mode: ModeId,
  extra?: string,
  region?: string | null,
  options: {
    /** Mark a never-written card as failed when this attempt fails (off for background jobs, which retry first). */
    markFailed?: boolean;
    onStage?: (stage: "researching" | "writing" | "checking" | "photos") => void;
  } = {},
): Promise<CardView> {
  const deck = await getDeck(deckId);
  const index = deck?.cards.findIndex((c) => c.id === cardId) ?? -1;
  if (!deck || index < 0) throw new GenerationError("Card not found.");
  const research = await deckResearch(deckId);

  try {
    const { card, imageQuery, found } = await generateCard({
      deckTitle: deck.title,
      prompt: deck.prompt,
      outline: deck.cards.map((c) => c.brief),
      index,
      mode,
      extra,
      previousLayout: deck.cards[index - 1]?.content?.layout,
      research,
      region,
      depth: deck.depth,
      onStage: options.onStage,
    });
    options.onStage?.("photos");
    const image = IMAGE_LAYOUTS.includes(card.layout)
      ? await uniquePhoto(deckId, cardId, (used) => findPhoto(imageQuery, used, { sources: research.sources, cover: index === 0 }))
      : null;
    const content = { ...card, image };
    const row = await db.card.update({
      where: { id: cardId },
      data: { status: "ready", content: JSON.stringify(content) },
    });
    if (found) await addResearch(deckId, found);
    return toCardView(row);
  } catch (error) {
    // Keep existing content on a failed regenerate; only mark never-generated cards as failed.
    if ((options.markFailed ?? true) && !deck.cards[index].content) {
      await db.card.update({ where: { id: cardId }, data: { status: "failed" } });
    }
    throw error;
  }
}

export async function updateCardContent(cardId: string, content: CardContent): Promise<CardView> {
  const normalized = normalizeCard(content);
  const row = await db.card.update({
    where: { id: cardId },
    data: {
      status: "ready",
      content: JSON.stringify(normalized),
      brief: JSON.stringify({ title: normalized.title, points: [] }),
    },
  });
  return toCardView(row);
}

export async function addCard(deckId: string, afterPosition: number, title: string): Promise<CardView> {
  return db.$transaction(async (tx) => {
    await tx.card.updateMany({
      where: { deckId, position: { gt: afterPosition } },
      data: { position: { increment: 1 } },
    });
    const row = await tx.card.create({
      data: { deckId, position: afterPosition + 1, brief: JSON.stringify({ title, points: [] }) },
    });
    return toCardView(row);
  });
}

export async function deleteCard(deckId: string, cardId: string): Promise<void> {
  await db.card.deleteMany({ where: { id: cardId, deckId } });
}

/** Sets the card order; ids not belonging to the deck are ignored. */
export async function reorderCards(deckId: string, cardIds: string[]): Promise<void> {
  const existing = await db.card.findMany({ where: { deckId }, select: { id: true } });
  const known = new Set(existing.map((c) => c.id));
  const ordered = cardIds.filter((id) => known.has(id));
  if (ordered.length !== known.size || new Set(ordered).size !== known.size) {
    throw new Error("Order must list every card exactly once.");
  }
  await db.$transaction(
    ordered.map((id, position) => db.card.update({ where: { id }, data: { position } })),
  );
}

/** Only paid plans can take the "Made with" badge off their slides. */
export const canRemoveBadge = (plan: string) => planOf(plan) !== "free";

export async function updateDeck(
  deckId: string,
  data: { title?: string; theme?: ThemeId; shared?: boolean; badge?: boolean; endSlide?: boolean; credits?: CreditsPlace },
): Promise<void> {
  await db.deck.update({ where: { id: deckId }, data });
}

/** Copies a deck the user owns, with all written cards. Returns the copy's id, or null. */
export async function duplicateDeck(userId: string, deckId: string): Promise<{ id: string } | null> {
  const deck = await db.deck.findFirst({ where: { id: deckId, userId }, include: { cards: { orderBy: { position: "asc" } } } });
  if (!deck) return null;
  const title = `Copy of ${deck.title}`;
  const copy = await db.deck.create({
    data: {
      userId,
      title: title.length > 120 ? `${title.slice(0, 119)}…` : title,
      prompt: deck.prompt,
      theme: deck.theme,
      mode: deck.mode,
      shared: deck.shared,
      badge: deck.badge,
      endSlide: deck.endSlide,
      credits: deck.credits,
      depth: deck.depth,
      researchId: deck.researchId,
      cards: {
        // Cards still being written are copied as failed so the copy never spends credits on its own.
        create: deck.cards.map((c) => ({ position: c.position, brief: c.brief, content: c.content, status: c.content ? "ready" : "failed" })),
      },
    },
  });
  return { id: copy.id };
}

/** Deletes the given decks if the user owns them; returns how many were deleted. */
export async function deleteDecks(userId: string, ids: string[]): Promise<number> {
  const { count } = await db.deck.deleteMany({ where: { userId, id: { in: ids } } });
  return count;
}

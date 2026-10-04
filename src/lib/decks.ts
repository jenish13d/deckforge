import "server-only";

import { generateCard, GenerationError } from "./ai";
import {
  CardContentSchema,
  OutlineSchema,
  normalizeCard,
  parseStored,
  type CardBrief,
  type CardContent,
} from "./cards";
import { db } from "./db";
import { newEditToken, tokenMatches } from "./edit-token";
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
  title: string;
  prompt: string;
  theme: string;
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
    include: { cards: { orderBy: { position: "asc" } } },
  });
  if (!deck) return null;
  return {
    id: deck.id,
    title: deck.title,
    prompt: deck.prompt,
    theme: deck.theme,
    cards: deck.cards.map(toCardView),
  };
}

export async function createDeck(input: {
  title: string;
  prompt: string;
  theme: ThemeId;
  outline: CardBrief[];
}): Promise<{ id: string; token: string }> {
  const { token, hash } = newEditToken();
  const deck = await db.deck.create({
    data: {
      title: input.title,
      prompt: input.prompt,
      theme: input.theme,
      editTokenHash: hash,
      cards: {
        create: input.outline.map((brief, position) => ({ position, brief: JSON.stringify(brief) })),
      },
    },
  });
  return { id: deck.id, token };
}

/** True when the token may edit this deck; false also when the deck doesn't exist. */
export async function canEdit(deckId: string, token: string | null): Promise<boolean> {
  const deck = await db.deck.findUnique({ where: { id: deckId }, select: { editTokenHash: true } });
  return deck !== null && tokenMatches(token, deck.editTokenHash);
}

/** Generates (or regenerates) one card and stores the result. */
export async function generateDeckCard(deckId: string, cardId: string, extra?: string): Promise<CardView> {
  const deck = await getDeck(deckId);
  const index = deck?.cards.findIndex((c) => c.id === cardId) ?? -1;
  if (!deck || index < 0) throw new GenerationError("Card not found.");

  try {
    const content = await generateCard({
      deckTitle: deck.title,
      prompt: deck.prompt,
      outline: deck.cards.map((c) => c.brief),
      index,
      extra,
    });
    const row = await db.card.update({
      where: { id: cardId },
      data: { status: "ready", content: JSON.stringify(content) },
    });
    return toCardView(row);
  } catch (error) {
    // Keep existing content on a failed regenerate; only mark never-generated cards as failed.
    if (!deck.cards[index].content) {
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

export async function updateDeck(deckId: string, data: { title?: string; theme?: ThemeId }): Promise<void> {
  await db.deck.update({ where: { id: deckId }, data });
}

import type { CardContent } from "./cards";
import { db } from "./db";

// Example pages: decks an admin made and chose to publish at /examples/<slug>, so people searching for
// "<topic> presentation" find a real deck. Only an admin's own decks can be published, never users' decks.

export const MIN_EXAMPLE_CARDS = 3;

/** "Photosynthesis: how plants make food" → "photosynthesis-how-plants-make-food-presentation". */
export function exampleSlug(text: string): string {
  let base = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  // Long titles are cut at a word, not mid-word.
  if (base.length > 70) base = base.slice(0, 71).replace(/-[^-]*$/, "");
  if (!base) return "";
  return /(^|-)(presentation|slides|ppt)$/.test(base) ? base : `${base}-presentation`;
}

/** The page title for an example: the deck title, with "presentation" added when it doesn't say so. */
export function exampleTitle(deckTitle: string): string {
  const title = deckTitle.trim();
  return /\b(presentation|slides|deck|ppt)\b/i.test(title) ? title : `${title} presentation`;
}

/** A search-result description from the slides: what the deck covers, in its own words. */
export function exampleDescription(title: string, cards: CardContent[]): string {
  const topics = cards
    .slice(1)
    .filter((c) => c.layout !== "section")
    .map((c) => c.title.trim())
    .filter(Boolean)
    .slice(0, 5);
  const text = `A ${cards.length}-slide example presentation on ${title}${topics.length ? `: ${topics.join(", ")}` : ""}. View it free or make your own.`;
  return text.length <= 170 ? text : `${text.slice(0, 166).replace(/[\s,:;]+\S*$/, "")}…`;
}

export type PublishResult = { ok: true; slug: string } | { ok: false; error: string };

/** Publishes the owner's deck at /examples/<slug> (and keeps its link shared, since the page shows it). */
export async function publishExample(deckId: string, ownerId: string, wanted: string): Promise<PublishResult> {
  const deck = await db.deck.findUnique({ where: { id: deckId }, select: { userId: true, title: true, cards: { select: { status: true } } } });
  if (!deck || deck.userId !== ownerId) return { ok: false, error: "Only your own decks can be published." };
  if (deck.cards.filter((c) => c.status === "ready").length < MIN_EXAMPLE_CARDS) return { ok: false, error: `The deck needs at least ${MIN_EXAMPLE_CARDS} finished slides.` };
  if (deck.cards.some((c) => c.status !== "ready")) return { ok: false, error: "Wait until every slide is finished (or delete the failed ones)." };
  const slug = exampleSlug(wanted || deck.title);
  if (!slug) return { ok: false, error: "Give the page an address made of letters or numbers." };
  const taken = await db.deck.findUnique({ where: { example: slug }, select: { id: true } });
  if (taken && taken.id !== deckId) return { ok: false, error: "Another example already uses that address." };
  await db.deck.update({ where: { id: deckId }, data: { example: slug, exampleAt: new Date(), shared: true } });
  return { ok: true, slug };
}

export async function unpublishExample(deckId: string, ownerId: string): Promise<boolean> {
  const { count } = await db.deck.updateMany({ where: { id: deckId, userId: ownerId, example: { not: null } }, data: { example: null, exampleAt: null } });
  return count > 0;
}

/** Published examples, newest first. */
export async function listExamples() {
  return db.deck.findMany({
    where: { example: { not: null } },
    orderBy: { exampleAt: "desc" },
    select: { id: true, title: true, example: true, updatedAt: true, _count: { select: { cards: true } } },
  });
}

export async function findExample(slug: string) {
  return db.deck.findUnique({ where: { example: slug }, select: { id: true, updatedAt: true } });
}

/** The admin's own decks, newest first, with whether each is published (for the admin page). */
export async function ownDecksForExamples(userId: string) {
  const decks = await db.deck.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 40,
    select: { id: true, title: true, example: true, _count: { select: { cards: true } } },
  });
  return decks.map((d) => ({ id: d.id, title: d.title, example: d.example, cards: d._count.cards }));
}

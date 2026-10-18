import { plainTitle, type CardBrief, type CardContent, type ContentDepth } from "./cards";
import { stems } from "./research";

// Finds written cards that are weak: empty, generic, off-plan or repeating another card. It is plain code
// (no AI call) and runs on every card; only a card it flags is sent back for the one rewrite a card
// already gets. A card is not flagged just because it has no numbers: ideas, processes and examples
// are often best explained without them.

export interface QualityContext {
  index: number;
  total: number;
  /** This card's plan, when the deck has one (older decks don't). */
  brief?: CardBrief;
  /** Every card's plan, to spot a card that repeats another. */
  outline: CardBrief[];
  density: ContentDepth;
}

export interface QualityIssues {
  /** Reasons that always call for a rewrite (the card says almost nothing). */
  hard: string[];
  /** Weaker signals: two of them together call for a rewrite. */
  soft: string[];
}

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean);

// Phrases that fill a line without telling the audience anything.
const FILLER = [
  /plays? an? (crucial|important|key|vital|significant) role/i,
  /\bin today'?s (fast-paced |modern |digital )?world\b/i,
  /\b(has|have|offers?) (many|numerous|several|a (wide )?range of) (benefits|advantages|applications|opportunities)\b/i,
  /\bis (very |extremely |incredibly )?important\b/i,
  /\b(various|numerous|many|several) (factors|aspects|ways|areas)\b/i,
  /\bmake(s)? a (big|significant|huge|real) (difference|impact)\b/i,
  /\b(it is|it's) (essential|crucial|vital) to\b/i,
  /\bcontinues? to (grow|evolve|improve)\b/i,
];

const MIN_WORDS_PER_ITEM: Record<ContentDepth, number> = { light: 4, standard: 8, rich: 13 };

const LIST_LAYOUTS = ["bullets", "columns", "timeline"];

function cardText(card: CardContent): string {
  return [card.title, card.subtitle, ...card.items.flatMap((i) => [i.heading, i.text]), ...card.stats.map((s) => `${s.value} ${s.label}`), ...card.table.rows.flat(), card.quote]
    .filter(Boolean)
    .join(" ");
}

const similarity = (a: Set<string>, b: Set<string>) => {
  if (!a.size || !b.size) return 0;
  let both = 0;
  for (const w of a) if (b.has(w)) both++;
  return both / Math.min(a.size, b.size);
};

/** A concrete detail: a figure, or a capitalised name that doesn't just start a sentence. */
const hasSpecifics = (texts: string[]) =>
  texts.some((t) => /\d/.test(t) || t.split(/(?<=[.!?])\s+/).some((sentence) => /\b[A-Z][a-z]{2,}/.test(sentence.trim().split(/\s+/).slice(1).join(" "))));

/** What is weak about a written card, if anything. */
export function qualityIssues(card: CardContent, ctx: QualityContext): QualityIssues {
  const hard: string[] = [];
  const soft: string[] = [];
  const { index, total, brief } = ctx;
  if (index === 0) return { hard, soft }; // the cover can say very little

  const isLast = index === total - 1;
  const hasContent = card.items.length >= 2 || card.stats.length > 0 || card.table.rows.length >= 2 || Boolean(card.quote);
  // A chapter divider is fine in a long deck, and a closing card may sum up in a sentence or two.
  const dividerOk = card.layout === "section" && total >= 10;
  const closingOk = isLast && words(`${card.subtitle} ${card.items.map((i) => `${i.heading} ${i.text}`).join(" ")}`).length >= 12;
  if (!hasContent && !dividerOk && !closingOk) {
    hard.push("The card says almost nothing: it is a title with at most one line.");
    return { hard, soft };
  }

  const items = card.items.map((i) => `${i.heading} ${i.text}`.trim());
  if (items.length >= 2) {
    const fillerCount = items.filter((t) => FILLER.some((f) => f.test(t))).length;
    if (fillerCount >= Math.ceil(items.length / 2)) soft.push("Several items are generic filler that tells the audience nothing specific.");
    if (LIST_LAYOUTS.includes(card.layout)) {
      const average = items.reduce((n, t) => n + words(t).length, 0) / items.length;
      if (average < MIN_WORDS_PER_ITEM[ctx.density]) soft.push("The items are too thin for the planned depth: say what, how or why.");
    }
  }

  if (brief?.keyMessage) {
    const message = stems(`${brief.keyMessage} ${brief.title}`);
    const text = stems(cardText(card));
    const title = stems(plainTitle(card.title));
    // A headline that only names the topic, with nothing of the planned point in it.
    const label = words(plainTitle(card.title)).length <= 4 && [...title].every((w) => stems(brief.title).has(w)) && ![...stems(brief.keyMessage)].some((w) => title.has(w));
    if (label && !["title", "section", "quote"].includes(card.layout)) soft.push("The headline names the topic instead of making the planned point.");
    if (message.size >= 4 && similarity(message, text) === 0) soft.push("The card doesn't deal with its planned key message.");
    // The same point as another card of the deck.
    const mine = stems(`${plainTitle(card.title)} ${card.subtitle}`);
    const repeats = ctx.outline.some((other, j) => {
      if (j === index || j === 0) return false;
      const theirs = stems(`${other.keyMessage ?? ""} ${other.title}`);
      return theirs.size >= 3 && mine.size >= 3 && similarity(theirs, mine) >= 0.8;
    });
    if (repeats) soft.push("The card repeats the point of another card.");
  }

  // Only a card that is meant to state checkable facts needs concrete details.
  const detail = [card.subtitle, ...card.items.flatMap((i) => [i.heading, i.text]), ...card.stats.map((st) => `${st.value} ${st.label}`), ...card.table.rows.flat()];
  if (brief?.evidence === true && card.layout !== "quote" && !hasSpecifics(detail)) {
    soft.push("The card is meant to state facts but gives no names, dates or figures.");
  }
  return { hard, soft };
}

/** Whether a card should go back for its one rewrite: it is empty, or shows two weaker signs of being weak. */
export const needsRepair = (issues: QualityIssues) => issues.hard.length > 0 || issues.soft.length >= 2;

/** A comparable score: fewer and lighter problems are better. */
export const issueScore = (issues: QualityIssues) => issues.hard.length * 10 + issues.soft.length;

/** The notes for the rewrite request. */
export function describeQuality(issues: QualityIssues): string {
  return [...issues.hard, ...issues.soft].map((i) => `- ${i}`).join("\n");
}

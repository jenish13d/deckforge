import { LAYOUTS, isContentDepth, isLayout, type CardBrief, type ContentDepth, type Layout, type Style } from "./cards";

// The deck plan. The outline call plans the whole story (purpose, key message, layout, depth,
// visual, evidence for every card). This file is the deterministic part: it reads what the model
// planned, makes it valid for the renderer, and evens out the layouts across the whole deck, in
// code, so no extra AI call is needed and the result doesn't depend on which card finished first.

// ---- The brief text -----------------------------------------------------------------------------

export interface BriefParts {
  /** The topic as the user wrote it. */
  topic: string;
  audience: string;
  /** What the deck should focus on (the presentation's purpose). */
  focus: string;
}

/**
 * Splits the brief the editor builds ("<topic>\n\nAudience: …\nFocus: …") back into its parts, so audience
 * and purpose reach the prompts as their own fields. A prompt without those lines is all topic.
 */
export function splitBrief(prompt: string): BriefParts {
  const audience = /^\s*Audience:[ \t]*(.+)$/im.exec(prompt)?.[1]?.trim() ?? "";
  const focus = /^\s*Focus:[ \t]*(.+)$/im.exec(prompt)?.[1]?.trim() ?? "";
  const topic = prompt.replace(/^\s*(Audience|Focus):[ \t]*.*$/gim, "").replace(/\n{3,}/g, "\n\n").trim();
  return { topic: topic || prompt.trim(), audience, focus };
}

// ---- Content depth ------------------------------------------------------------------------------

/**
 * How much text a card gets. The detail level (Low/Medium/High, Pro) sets the baseline; on Medium, the only
 * level every plan has, the plan's own depth for the card decides, so Visual, Detailed and Auto read differently.
 * Cards from before the plan existed have no depth and get exactly what Medium always meant: standard.
 */
export function effectiveDensity(depth: "low" | "medium" | "high", planned: string | undefined): ContentDepth {
  if (depth === "low") return "light";
  if (depth === "high") return "rich";
  return isContentDepth(planned) ? planned : "standard";
}

function normalizeDepth(raw: string | undefined, style: Style, evidence: boolean): ContentDepth {
  const planned = isContentDepth(raw) ? raw : undefined;
  if (style === "visual") return planned === "rich" ? "standard" : (planned ?? "light");
  if (style === "detailed") return planned === "light" ? "standard" : (planned ?? (evidence ? "rich" : "standard"));
  return planned ?? "standard";
}

// ---- Layouts ------------------------------------------------------------------------------------

const SYNONYMS: Record<string, Layout> = {
  cover: "title",
  list: "bullets",
  bullet: "bullets",
  points: "bullets",
  text: "bullets",
  column: "columns",
  comparison: "columns",
  compare: "columns",
  stat: "stats",
  numbers: "stats",
  figures: "stats",
  metrics: "stats",
  steps: "timeline",
  process: "timeline",
  chronology: "timeline",
  roadmap: "timeline",
  grid: "table",
  divider: "section",
  chapter: "section",
  graph: "chart",
  "bar chart": "chart",
  "line chart": "chart",
  trend: "chart",
};

const SEQUENCE = /\b(step|steps|process|stage|stages|phase|phases|timeline|history|evolution|roadmap|workflow|journey|sequence|chronolog\w*|milestone\w*|how it works|how to|procedures?|protocols?|lifecycle)\b/i;
const COMPARE = /\b(compare|compares|comparison|versus|vs\.?|difference|differences|options?|trade-?offs?|pros|cons|alternatives?)\b/i;

const textOf = (card: CardBrief) => [card.purpose, card.keyMessage, card.title, ...card.points].filter(Boolean).join(" ");

/** Whether a card's points follow an order: steps, stages, dates or a process. */
export function inOrder(card: CardBrief): boolean {
  return SEQUENCE.test(textOf(card)) || card.points.filter((p) => /\b(1[5-9]\d\d|20\d\d)\b|\b(first|then|next|finally|after|before|day|week|month|year)\b/i.test(p)).length >= 2;
}

/** The layout that shows a card's planned content best, from the words of the plan (used when the plan's layout is missing or unusable). */
export function inferLayout(card: CardBrief): Layout {
  const text = textOf(card);
  const withNumbers = card.points.filter((p) => /\d/.test(p)).length;
  if (COMPARE.test(text)) return card.points.length >= 4 ? "table" : "columns";
  if (SEQUENCE.test(text) && card.points.length >= 3) return "timeline";
  if (withNumbers >= 2 && card.evidence !== false && card.points.length <= 4) return "stats";
  return "bullets";
}

/** The layout a card would take in place of `current`, if one fits its content better; otherwise null. */
function alternative(card: CardBrief, current: Layout, avoid: ReadonlySet<Layout>): Layout | null {
  const text = textOf(card);
  const withNumbers = card.points.filter((p) => /\d/.test(p)).length;
  const options: Layout[] = [];
  if (SEQUENCE.test(text) && card.points.length >= 3) options.push("timeline");
  if (withNumbers >= 2 && card.evidence !== false && card.points.length <= 4) options.push("stats");
  if (COMPARE.test(text) || (card.points.length >= 2 && card.points.length <= 3)) options.push("columns");
  return options.find((l) => l !== current && !avoid.has(l)) ?? null;
}

export interface PlanOptions {
  style: Style;
  /** The deck has sources (or the user's files), so quotes can be real. */
  grounded: boolean;
}

/**
 * Makes the planned cards usable and balanced, deterministically:
 * - every layout is one the renderer supports; unusable ones are replaced by the best fit for the content;
 * - card 1 is the cover (`title`), `title` is never used again, a `section` divider only in decks of 10+ cards
 *   (and not for a card that has points to make), and a `quote` only when the deck has sources and only once;
 * - a run of three identical layouts is broken, and two list slides in a row are varied when another layout fits
 *   the content (a timeline after a timeline, or columns after columns, is left alone: that can be right);
 * - depth, evidence and the other plan fields are checked, not invented beyond safe defaults.
 * Cards from before the plan existed (no layout) are planned from their words too.
 */
export function planDeck(cards: CardBrief[], { style, grounded }: PlanOptions): CardBrief[] {
  const total = cards.length;
  let quotes = 0;
  const planned: CardBrief[] = cards.map((raw, i) => {
    const evidence = raw.evidence ?? grounded;
    const card: CardBrief = { ...raw, evidence };
    const word = (raw.layout ?? "").trim().toLowerCase();
    let layout: Layout | null = isLayout(word) ? word : (SYNONYMS[word] ?? null);

    if (i === 0) layout = "title";
    else {
      if (layout === "title") layout = null;
      // A chapter divider carries no content of its own: a card with points to make is a content card.
      const divider = card.points.length === 0 || /\b(divid|chapter|section|transition|part \w+)/i.test(card.purpose ?? "");
      if (layout === "section" && (total < 10 || !divider || i === total - 1)) layout = null;
      // Numbered steps imply an order: parallel points (risks, factors, options) are a list, not a timeline.
      if (layout === "timeline" && !inOrder(card)) layout = null;
      if (layout === "quote" && (!grounded || quotes >= 1)) layout = null;
      // A chart needs published figures: only in decks with sources (or the user's files).
      if (layout === "chart" && !grounded) layout = null;
      layout ??= inferLayout(card);
      if (layout === "quote") quotes++;
    }
    return {
      ...card,
      layout,
      contentDepth: normalizeDepth(raw.contentDepth, style, evidence),
      ...(i === 0 ? { after: "" } : {}),
    };
  });

  // Variety, across the whole deck (the cover and the final takeaway keep what was planned).
  const at = (i: number) => planned[i]?.layout as Layout | undefined;
  const avoidAround = (i: number) => new Set<Layout>([at(i - 1), at(i + 1)].filter((l): l is Layout => Boolean(l)));
  for (let i = 2; i < total; i++) {
    const layout = at(i) as Layout;
    // Three in a row of anything: change the middle one (or the last but one, when the run ends at the takeaway).
    // When nothing in its plan points to a better layout, columns (2-3 parallel items) is the general-purpose alternative.
    if (layout === at(i - 1) && layout === at(i - 2)) {
      const target = i === total - 1 ? i - 1 : i;
      const current = at(target) as Layout;
      const avoid = avoidAround(target);
      const swap = alternative(planned[target], current, avoid) ?? (current !== "columns" && !avoid.has("columns") ? "columns" : null);
      if (swap) planned[target] = { ...planned[target], layout: swap };
      continue;
    }
    // Two plain list slides in a row look the same: vary the second when something else fits.
    if (layout === at(i - 1) && layout === "bullets" && i < total - 1) {
      const swap = alternative(planned[i], layout, avoidAround(i));
      if (swap) planned[i] = { ...planned[i], layout: swap };
    }
  }
  return planned.map((c) => ({ ...c, layout: LAYOUTS.includes(c.layout as Layout) ? c.layout : "bullets" }));
}

/** The layouts of a plan, in order (for tests and logs). */
export const layoutsOf = (cards: CardBrief[]): string[] => cards.map((c) => c.layout ?? "");

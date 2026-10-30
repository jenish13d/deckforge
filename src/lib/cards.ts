import { z } from "zod";

// Zod would otherwise probe for eval() support, which the site's security policy (CSP) blocks.
z.config({ jitless: true });

export const LAYOUTS = ["title", "bullets", "columns", "stats", "quote", "timeline", "section", "table", "chart"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const MAX_ITEMS = 5;
export const MAX_TABLE_COLUMNS = 4;
export const MAX_TABLE_ROWS = 7;
export const MIN_CHART_POINTS = 3;
export const MAX_CHART_POINTS = 8;
export const MIN_CARDS = 3;
export const MAX_CARDS = 12;

/** Layouts that have room for a photo (beside the text, or behind it on the cover). */
export const IMAGE_LAYOUTS: readonly Layout[] = ["title", "section", "bullets", "quote", "stats", "timeline"];

/** A photo shown beside the text. `credit` is shown as "Photo: <credit>", linking to creditUrl. */
export const CardImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  credit: z.string(),
  creditUrl: z.string(),
  /** Pixel size, when known: lets slides show the whole photo instead of cropping a mismatched one. */
  width: z.number().optional(),
  height: z.number().optional(),
});
export type CardImage = z.infer<typeof CardImageSchema>;

const TableSchema = z.object({ columns: z.array(z.string()), rows: z.array(z.array(z.string())) });
export type CardTable = z.infer<typeof TableSchema>;

/**
 * A simple chart of figures in one unit: "bar" compares groups, "line" shows change over time (points in order).
 * Every value is a figure from the sources, checked like any other number on a slide.
 */
const ChartSchema = z.object({
  kind: z.enum(["bar", "line"]),
  /** What the values are in: "%", "ppm", "million people". Shown with each value. */
  unit: z.string(),
  points: z.array(z.object({ label: z.string(), value: z.number() })),
});
export type CardChart = z.infer<typeof ChartSchema>;
export const EMPTY_CHART: CardChart = { kind: "bar", unit: "", points: [] };

/** The chart as the model writes it: values may come back as text ("72%", "1,000"). */
const GeneratedChartSchema = z.object({
  kind: z.string(),
  unit: z.string(),
  points: z.array(z.object({ label: z.string(), value: z.union([z.number(), z.string()]) })),
});

const textFields = {
  icon: z.string(),
  title: z.string(),
  subtitle: z.string(),
  items: z.array(z.object({ heading: z.string(), text: z.string() })),
  stats: z.array(z.object({ value: z.string(), label: z.string() })),
  quote: z.string(),
  quoteAuthor: z.string(),
};

/** A card as stored and displayed. Unused fields are "" or []. */
export const CardContentSchema = z.object({
  layout: z.enum(LAYOUTS),
  ...textFields,
  /** Small label above the title, e.g. "2014 · Brazil". Missing in older cards. */
  eyebrow: z.string().default(""),
  table: TableSchema.default({ columns: [], rows: [] }),
  /** Only on chart cards (missing on others and in older cards). */
  chart: ChartSchema.optional(),
  /** Speaker notes, shown to the presenter and in the PowerPoint notes (missing in older cards). */
  notes: z.string().optional(),
  image: CardImageSchema.nullable().optional(),
});
export type CardContent = z.infer<typeof CardContentSchema>;

/**
 * What the model is asked to return. The SDK's structured-output conversion
 * loosens enums to a description, so layout is a plain string here and
 * normalizeCard maps unknown values to a safe layout. imageQuery is turned into
 * a photo by the server (or ignored when photos are off).
 */
export const GeneratedCardSchema = z.object({
  layout: z.string(),
  eyebrow: z.string(),
  ...textFields,
  table: TableSchema,
  chart: GeneratedChartSchema.optional(),
  /** Speaker notes: what the presenter says while the slide is shown. */
  notes: z.string(),
  imageQuery: z.string(),
});
export type GeneratedCard = z.infer<typeof GeneratedCardSchema>;

/** Accepts only https photos from the sources the app searches (Pexels, Flickr, Wikimedia). */
export function isAllowedImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      (u.hostname === "images.pexels.com" ||
        u.hostname === "upload.wikimedia.org" ||
        u.hostname === "thumb.wikimedia.org" ||
        u.hostname === "staticflickr.com" ||
        u.hostname.endsWith(".staticflickr.com"))
    );
  } catch {
    return false;
  }
}

export function isLayout(value: string): value is Layout {
  return (LAYOUTS as readonly string[]).includes(value);
}

// ---- Presentation style and the deck plan ----------------------------------------------------

/** How a deck reads: short and visual, explained in detail, or chosen by the AI from the topic and audience. */
export const STYLES = ["auto", "visual", "detailed"] as const;
export type Style = (typeof STYLES)[number];
export const DEFAULT_STYLE: Style = "auto";
export const isStyle = (value: unknown): value is Style => typeof value === "string" && (STYLES as readonly string[]).includes(value);
/** Anything that isn't a known style (missing, old, malformed) is Auto. */
export const parseStyle = (value: unknown): Style => (isStyle(value) ? value : DEFAULT_STYLE);

/** How much text a card needs. */
export const CONTENT_DEPTHS = ["light", "standard", "rich"] as const;
export type ContentDepth = (typeof CONTENT_DEPTHS)[number];
export const isContentDepth = (value: unknown): value is ContentDepth => typeof value === "string" && (CONTENT_DEPTHS as readonly string[]).includes(value);

/**
 * One planned card, as stored with the card (its "brief") and shown in the outline. Only title and
 * points are required: decks made before the deck plan existed have nothing else, and still work.
 * The plan fields say what the card is for, so every card is written knowing the whole story.
 */
export const CardBriefSchema = z.object({
  title: z.string(),
  /** The supporting points: facts, claims or examples the card should make. */
  points: z.array(z.string()),
  /** What the card does in the story ("show the problem", "give evidence"). */
  purpose: z.string().optional(),
  /** The one sentence the audience should remember from this card. */
  keyMessage: z.string().optional(),
  /** Planned layout (validated against the renderer's layouts before cards are written). */
  layout: z.string().optional(),
  contentDepth: z.string().optional(),
  /** What to show beside the text: a photo of something specific, or "none". */
  visual: z.string().optional(),
  /** The card states checkable facts (as opposed to explaining an idea, process or example). */
  evidence: z.boolean().optional(),
  /** How the card follows from the previous one. */
  after: z.string().optional(),
});

export const OutlineSchema = z.object({
  title: z.string(),
  cards: z.array(CardBriefSchema),
});
export type Outline = z.infer<typeof OutlineSchema>;
export type CardBrief = z.infer<typeof CardBriefSchema>;

/**
 * What the model is asked to return for an outline: the same cards with every plan field present
 * (plain strings, like layout in GeneratedCardSchema, because enums get loosened by structured output).
 * Missing fields are filled in with defaults for models that skip them, then normalized by planDeck.
 */
export const PlannedOutlineSchema = z.object({
  title: z.string(),
  cards: z.array(
    z.object({
      title: z.string(),
      purpose: z.string(),
      keyMessage: z.string(),
      points: z.array(z.string()),
      layout: z.string(),
      contentDepth: z.string(),
      visual: z.string(),
      evidence: z.boolean(),
      after: z.string(),
    }),
  ),
});

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

/** Shortens text at its last sentence or clause break that fits, so a long table cell reads as complete; a word cut is the fallback. */
export function clipAtBreak(s: string, max: number): string {
  if (s.length <= max) return s;
  const head = s.slice(0, max);
  const stop = Math.max(head.lastIndexOf(". "), head.lastIndexOf("; "), head.lastIndexOf(", "), head.lastIndexOf(" — "));
  if (stop >= max * 0.4) return head.slice(0, stop).replace(/[,;\s—]+$/, "") + (head[stop] === "." ? "." : "");
  return clip(s, max);
}

// Source labels the AI may copy into slide text ("[who.int]", "[Tooth decay]", "(Source: WHO)").
const BRACKETED = /\s*\[([^\]\n]{2,80})\]/g;
const SOURCE_NOTE = /\s*\((?:source|sources|via|ref\.?|see)\s*:?\s[^)]{1,80}\)/gi;

/**
 * Removes citations of the deck's sources from a card's text: a bracket holding a source's name or a web
 * address goes; a [placeholder] for the user to fill in stays. The deck lists its sources separately.
 */
export function removeCitations(card: CardContent, labels: string[]): CardContent {
  const known = new Set(labels.map((l) => l.toLowerCase().replace(/^file:/, "").replace(/^www\./, "").trim()).filter(Boolean));
  const isSource = (inside: string) =>
    inside
      .split(/[,;]\s*/)
      .every((part) => {
        const p = part.toLowerCase().replace(/^www\./, "").trim();
        return known.has(p) || /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/.test(p) || /wikipedia/.test(p);
      });
  const clean = (text: string) =>
    text
      .replace(BRACKETED, (whole, inside: string) => (isSource(inside) ? "" : whole))
      .replace(SOURCE_NOTE, "")
      .replace(/\s+([.,;:!?])/g, "$1")
      .trim();
  return {
    ...card,
    title: clean(card.title),
    subtitle: clean(card.subtitle),
    items: card.items.map((i) => ({ heading: clean(i.heading), text: clean(i.text) })),
    stats: card.stats.map((s) => ({ value: s.value, label: clean(s.label) })),
    table: { columns: card.table.columns, rows: card.table.rows.map((row) => row.map(clean)) },
    ...(card.notes ? { notes: clean(card.notes) } : {}),
  };
}

type CardInput = Omit<GeneratedCard, "imageQuery" | "eyebrow" | "table" | "chart" | "notes"> & {
  eyebrow?: string;
  notes?: string;
  table?: CardTable;
  chart?: { kind: string; unit: string; points: { label: string; value: number | string }[] };
  image?: CardImage | null;
};

/** A number from a chart value the model wrote: 72, "72%", "1,000", "0.7". NaN when it isn't one. */
export function chartNumber(value: number | string): number {
  if (typeof value === "number") return value;
  const m = /-?\d[\d,]*(?:\.\d+)?|-?\.\d+/.exec(value.replace(/[\u2212]/g, "-"));
  return m ? Number(m[0].replace(/,/g, "")) : Number.NaN;
}

function normalizeChart(chart: { kind: string; unit: string; points: { label: string; value: number | string }[] } | undefined): CardChart {
  if (!chart) return EMPTY_CHART;
  const points = chart.points
    .map((p) => ({ label: clip(p.label.trim(), 28), value: chartNumber(p.value) }))
    .filter((p) => p.label && Number.isFinite(p.value))
    .slice(0, MAX_CHART_POINTS);
  return { kind: chart.kind.trim().toLowerCase() === "line" ? "line" : "bar", unit: clip(chart.unit.trim(), 16), points };
}

/** How a chart value reads on the slide and in the fact check: "72%", "1,450 ppm". */
export function formatChartValue(value: number, unit: string): string {
  const n = value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (!unit) return n;
  return /^[%°]/.test(unit) ? `${n}${unit}` : `${n} ${unit}`;
}

function normalizeTable(table: CardTable | undefined): CardTable {
  const columns = (table?.columns ?? []).slice(0, MAX_TABLE_COLUMNS).map((c) => clip(c.trim(), 40));
  if (!columns.some(Boolean)) return { columns: [], rows: [] };
  const rows = (table?.rows ?? [])
    .map((row) => columns.map((_, i) => clipAtBreak((row[i] ?? "").trim(), 110)))
    .filter((row) => row.some(Boolean))
    .slice(0, MAX_TABLE_ROWS);
  return { columns, rows };
}

/** Keeps generated or user-edited content within what a card can display. */
export function normalizeCard(raw: CardInput): CardContent {
  const layout = raw.layout.trim().toLowerCase();
  const image = raw.image && isAllowedImageUrl(raw.image.url)
    ? {
        url: raw.image.url,
        alt: clip(raw.image.alt.trim(), 200),
        credit: clip(raw.image.credit.trim(), 80),
        creditUrl: isSafeLink(raw.image.creditUrl) ? raw.image.creditUrl : "",
      }
    : null;
  const table = normalizeTable(raw.table);
  const chart = normalizeChart(raw.chart);
  const known = isLayout(layout) ? layout : "bullets";
  const stats = raw.stats.slice(0, 4).map((s) => ({ value: clip(s.value.trim(), 16), label: clipAtBreak(s.label.trim(), 90) }));
  // A chart needs at least three points; with fewer, its figures are shown as big numbers instead.
  const thinChart = known === "chart" && chart.points.length < MIN_CHART_POINTS;
  const statsFromChart = thinChart && stats.length === 0 ? chart.points.map((p) => ({ value: clip(formatChartValue(p.value, chart.unit), 16), label: p.label })) : stats;
  return {
    // A table card needs a table; without one it falls back to a list.
    layout: known === "table" && table.rows.length === 0 ? "bullets" : thinChart ? (statsFromChart.length ? "stats" : "bullets") : known,
    eyebrow: clip((raw.eyebrow ?? "").trim(), 40),
    icon: [...raw.icon.trim()].slice(0, 2).join(""),
    title: tidyHighlight(clip(raw.title.trim(), 120)),
    subtitle: clip(raw.subtitle.trim(), 240),
    items: raw.items
      .slice(0, MAX_ITEMS)
      .map((i) => ({ heading: clip(i.heading.trim(), 80), text: clip(i.text.trim(), 360) })),
    stats: statsFromChart,
    quote: clip(raw.quote.trim(), 300),
    quoteAuthor: clip(raw.quoteAuthor.trim(), 80),
    table,
    ...(known === "chart" && !thinChart ? { chart } : {}),
    ...(raw.notes?.trim() ? { notes: clip(raw.notes.trim(), 1200) } : {}),
    image,
  };
}

// Titles can highlight their key words, written as "The numbers *say it first*":
// the starred words show in the theme's accent colour.

/** Keeps one well-formed *highlight* and drops any other stray asterisks. */
export function tidyHighlight(title: string): string {
  const m = /\*([^*]+)\*/.exec(title);
  const plain = (t: string) => t.replace(/\*/g, "");
  if (!m || !m[1].trim()) return plain(title).replace(/\s+/g, " ").trim();
  return `${plain(title.slice(0, m.index))}*${m[1].trim()}*${plain(title.slice(m.index + m[0].length))}`.replace(/\s+/g, " ").trim();
}

/** The title split into plain and highlighted parts. */
export function titleParts(title: string): { text: string; highlight: boolean }[] {
  return title
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((part) => (part.startsWith("*") && part.endsWith("*") && part.length > 2 ? { text: part.slice(1, -1), highlight: true } : { text: part, highlight: false }));
}

/** The title without highlight marks, for plain-text uses. */
export const plainTitle = (title: string) => title.replace(/\*/g, "");

function isSafeLink(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

/** What /api/image may fetch: slide photos plus Openverse's search-result thumbnails. */
export function isProxyableImageUrl(url: string): boolean {
  if (isAllowedImageUrl(url)) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "api.openverse.org" && /^\/v1\/images\/[\w-]+\/thumb\/$/.test(u.pathname);
  } catch {
    return false;
  }
}

/** Whether a card shows its photo (the layout must have room for it). */
export function showsImage(card: CardContent): card is CardContent & { image: CardImage } {
  return Boolean(card.image) && IMAGE_LAYOUTS.includes(card.layout);
}

/** Same-origin URL for a card photo, so PDF and PowerPoint export can read its pixels. */
export function imageSrc(url: string): string {
  return `/api/image?src=${encodeURIComponent(url)}`;
}

export function normalizeOutline(raw: Outline, maxCards: number): Outline {
  return {
    title: clip(raw.title.trim(), 120) || "Untitled",
    cards: raw.cards
      .filter((c) => c.title.trim())
      .slice(0, maxCards)
      .map((c) => cleanBrief(c)),
  };
}

const optionalText = (value: unknown, max: number): string | undefined => {
  const text = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  return text ? clip(text, max) : undefined;
};

/**
 * A planned card with its text trimmed and its plan fields checked. Unknown or empty plan fields are
 * left out (not made up), so a card from an old deck or a hand-written outline stays plain.
 */
export function cleanBrief(raw: Partial<CardBrief> & { title?: unknown; points?: unknown }): CardBrief {
  const points = Array.isArray(raw.points) ? raw.points.filter((p): p is string => typeof p === "string") : [];
  const depth = typeof raw.contentDepth === "string" ? raw.contentDepth.trim().toLowerCase() : "";
  return {
    title: clip(String(raw.title ?? "").trim(), 120),
    points: points.map((p) => clip(p.trim(), 200)).filter(Boolean).slice(0, 5),
    ...(optionalText(raw.purpose, 80) ? { purpose: optionalText(raw.purpose, 80) } : {}),
    ...(optionalText(raw.keyMessage, 240) ? { keyMessage: optionalText(raw.keyMessage, 240) } : {}),
    ...(optionalText(raw.layout, 20) ? { layout: optionalText(raw.layout, 20)!.toLowerCase() } : {}),
    ...(isContentDepth(depth) ? { contentDepth: depth } : {}),
    ...(optionalText(raw.visual, 160) ? { visual: optionalText(raw.visual, 160) } : {}),
    ...(typeof raw.evidence === "boolean" ? { evidence: raw.evidence } : {}),
    ...(optionalText(raw.after, 120) ? { after: optionalText(raw.after, 120) } : {}),
  };
}

/** Topic-specific choices offered before the outline: who the deck is for and its angle. */
export const SetupSchema = z.object({
  audiences: z.array(z.string()),
  angles: z.array(z.string()),
});

/** What the editor's assistant proposes: a reply plus changes the user can apply. */
export const AssistSchema = z.object({
  reply: z.string(),
  actions: z.array(
    z.object({
      type: z.enum(["add", "rewrite", "theme"]),
      /** add: insert after this slide number (0 = at the start). rewrite: the slide to rewrite. */
      slide: z.number(),
      /** add: the new slide's title. */
      title: z.string(),
      /** rewrite: what to change. */
      instruction: z.string(),
      /** theme: the theme id. */
      theme: z.string(),
    }),
  ),
});
export type Assist = z.infer<typeof AssistSchema>;

export function emptyCard(title: string): CardContent {
  return {
    layout: "bullets",
    eyebrow: "",
    icon: "",
    title,
    subtitle: "",
    items: [],
    stats: [],
    quote: "",
    quoteAuthor: "",
    table: { columns: [], rows: [] },
    image: null,
  };
}

/** Parses a stored JSON column, returning null when it is empty or invalid. */
export function parseStored<T>(schema: z.ZodType<T>, json: string): T | null {
  if (!json) return null;
  try {
    const result = schema.safeParse(JSON.parse(json));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Width ÷ height of a slide's photo area: the whole 16:9 slide for covers, 44% of it beside text. */
export const FRAME_ASPECT = { fullBleed: 16 / 9, split: (0.44 * 16) / 9 } as const;

/**
 * How to fit a photo into its frame without cutting what matters. Cropping the sides of
 * a wide photo is usually fine; cropping the top and bottom cuts off heads, so a much
 * taller (or far wider) photo is shown whole, on a blurred copy of itself. Cropped photos
 * keep the upper part, where faces usually are.
 */
export function photoFit(photoAspect: number, frameAspect: number): { mode: "cover" | "contain"; focusY: number } {
  if (!Number.isFinite(photoAspect) || photoAspect <= 0) return { mode: "cover", focusY: 50 };
  const taller = photoAspect < frameAspect;
  const ratio = taller ? frameAspect / photoAspect : photoAspect / frameAspect;
  if (ratio > (taller ? 1.3 : 2.2)) return { mode: "contain", focusY: 50 };
  return { mode: "cover", focusY: taller ? 25 : 50 };
}

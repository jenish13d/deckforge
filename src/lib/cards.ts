import { z } from "zod";

export const LAYOUTS = ["title", "bullets", "columns", "stats", "quote", "timeline", "section", "table"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const MAX_ITEMS = 5;
export const MAX_TABLE_COLUMNS = 4;
export const MAX_TABLE_ROWS = 7;
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

export const OutlineSchema = z.object({
  title: z.string(),
  cards: z.array(z.object({ title: z.string(), points: z.array(z.string()) })),
});
export type Outline = z.infer<typeof OutlineSchema>;
export type CardBrief = Outline["cards"][number];

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

type CardInput = Omit<GeneratedCard, "imageQuery" | "eyebrow" | "table"> & {
  eyebrow?: string;
  table?: CardTable;
  image?: CardImage | null;
};

function normalizeTable(table: CardTable | undefined): CardTable {
  const columns = (table?.columns ?? []).slice(0, MAX_TABLE_COLUMNS).map((c) => clip(c.trim(), 40));
  if (!columns.some(Boolean)) return { columns: [], rows: [] };
  const rows = (table?.rows ?? [])
    .map((row) => columns.map((_, i) => clip((row[i] ?? "").trim(), 80)))
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
  const known = isLayout(layout) ? layout : "bullets";
  return {
    // A table card needs a table; without one it falls back to a list.
    layout: known === "table" && table.rows.length === 0 ? "bullets" : known,
    eyebrow: clip((raw.eyebrow ?? "").trim(), 40),
    icon: [...raw.icon.trim()].slice(0, 2).join(""),
    title: clip(raw.title.trim(), 120),
    subtitle: clip(raw.subtitle.trim(), 240),
    items: raw.items
      .slice(0, MAX_ITEMS)
      .map((i) => ({ heading: clip(i.heading.trim(), 80), text: clip(i.text.trim(), 280) })),
    stats: raw.stats
      .slice(0, 4)
      .map((s) => ({ value: clip(s.value.trim(), 16), label: clip(s.label.trim(), 80) })),
    quote: clip(raw.quote.trim(), 300),
    quoteAuthor: clip(raw.quoteAuthor.trim(), 80),
    table,
    image,
  };
}

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
      .map((c) => ({
        title: clip(c.title.trim(), 120),
        points: c.points.map((p) => clip(p.trim(), 200)).filter(Boolean).slice(0, 5),
      })),
  };
}

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

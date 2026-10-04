import { z } from "zod";

export const LAYOUTS = ["title", "bullets", "columns", "stats", "quote", "timeline", "section"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const MAX_ITEMS = 5;
export const MIN_CARDS = 3;
export const MAX_CARDS = 12;

/** Layouts that have room for a photo beside the text. */
export const IMAGE_LAYOUTS: readonly Layout[] = ["title", "section", "bullets", "quote"];

/** A stock photo shown beside the text. Only Pexels images are accepted. */
export const CardImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  credit: z.string(),
  creditUrl: z.string(),
});
export type CardImage = z.infer<typeof CardImageSchema>;

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
  ...textFields,
  imageQuery: z.string(),
});
export type GeneratedCard = z.infer<typeof GeneratedCardSchema>;

/** Accepts only https photos from Pexels' image CDN. */
export function isAllowedImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "images.pexels.com";
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

type CardInput = Omit<GeneratedCard, "imageQuery"> & { image?: CardImage | null };

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
  return {
    layout: isLayout(layout) ? layout : "bullets",
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
    icon: "",
    title,
    subtitle: "",
    items: [],
    stats: [],
    quote: "",
    quoteAuthor: "",
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

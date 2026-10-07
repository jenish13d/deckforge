import { MAX_TABLE_ROWS, showsImage, type CardContent } from "./cards";
import { SITE } from "./site";

// How a finished deck is shown and exported: the "Made with" badge, an optional closing
// slide, and where photo credits go. Free decks always carry the badge.

export type CreditsPlace = "slide" | "end";

export interface DeckLook {
  badge: boolean;
  endSlide: boolean;
  credits: CreditsPlace;
}

export const DEFAULT_LOOK: DeckLook = { badge: true, endSlide: false, credits: "slide" };

export const isCreditsPlace = (value: unknown): value is CreditsPlace => value === "slide" || value === "end";

const blank = { eyebrow: "", icon: "", subtitle: "", items: [], stats: [], quote: "", quoteAuthor: "", table: { columns: [], rows: [] }, image: null };

/** Where a photo came from, for the credits slide ("Wikimedia Commons", "Flickr"…). */
function sourceName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.endsWith("wikimedia.org") || host.endsWith("wikipedia.org")) return "Wikimedia Commons";
    if (host.endsWith("flickr.com")) return "Flickr";
    if (host.endsWith("pexels.com")) return "Pexels";
    return host;
  } catch {
    return "";
  }
}

/** Slides listing every photo's author and licence, used when credits go at the end. */
export function creditSlides(cards: CardContent[]): CardContent[] {
  const rows = cards.flatMap((card, i) => {
    const credit = showsImage(card) ? card.image.credit : "";
    if (!credit) return [];
    const source = card.image?.creditUrl ? sourceName(card.image.creditUrl) : "";
    return [[`${i + 1}`, source ? `${credit} · ${source}` : credit]];
  });
  const slides: CardContent[] = [];
  for (let i = 0; i < rows.length; i += MAX_TABLE_ROWS) {
    slides.push({
      ...blank,
      layout: "table",
      icon: "📷",
      title: "Photo *credits*",
      subtitle: rows.length > MAX_TABLE_ROWS ? `Part ${i / MAX_TABLE_ROWS + 1} of ${Math.ceil(rows.length / MAX_TABLE_ROWS)}` : "",
      table: { columns: ["Slide", "Photo"], rows: rows.slice(i, i + MAX_TABLE_ROWS) },
    });
  }
  return slides;
}

export const endSlide = (): CardContent => ({
  ...blank,
  layout: "title",
  icon: "✨",
  title: `Made with *${SITE.name}*`,
  subtitle: `Make your own deck in a minute at ${SITE.domain}`,
});

/** The slides as presented and exported: credits moved to the end when asked, plus the closing slide. */
export function deckSlides(cards: CardContent[], look: DeckLook): CardContent[] {
  const main =
    look.credits === "end"
      ? cards.map((card) => (card.image ? { ...card, image: { ...card.image, credit: "", creditUrl: "" } } : card))
      : cards;
  return [...main, ...(look.credits === "end" ? creditSlides(cards) : []), ...(look.endSlide ? [endSlide()] : [])];
}

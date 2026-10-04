import { describe, expect, it } from "vitest";

import { CardContentSchema, imageSrc, normalizeCard, normalizeOutline, parseStored, showsImage, type GeneratedCard } from "../cards";

const base: GeneratedCard = {
  layout: "bullets",
  icon: "🚀",
  title: "Why now",
  subtitle: "",
  items: [],
  stats: [],
  quote: "",
  quoteAuthor: "",
  imageQuery: "",
};

describe("normalizeCard", () => {
  it("maps unknown layouts to bullets and accepts known ones case-insensitively", () => {
    expect(normalizeCard({ ...base, layout: "diagram" }).layout).toBe("bullets");
    expect(normalizeCard({ ...base, layout: " Stats " }).layout).toBe("stats");
  });

  it("caps items and stats", () => {
    const items = Array.from({ length: 9 }, (_, i) => ({ heading: `H${i}`, text: "t" }));
    const stats = Array.from({ length: 7 }, () => ({ value: "1", label: "l" }));
    const card = normalizeCard({ ...base, items, stats });
    expect(card.items).toHaveLength(5);
    expect(card.stats).toHaveLength(4);
  });

  it("clips overly long text with an ellipsis", () => {
    const card = normalizeCard({ ...base, title: "x".repeat(500) });
    expect(card.title).toHaveLength(120);
    expect(card.title.endsWith("…")).toBe(true);
  });

  it("keeps at most two characters of icon", () => {
    expect(normalizeCard({ ...base, icon: "🚀 rocket" }).icon).toBe("🚀 ");
  });
});

describe("normalizeOutline", () => {
  it("drops untitled cards, trims to the card count and limits points", () => {
    const outline = normalizeOutline(
      {
        title: "  ",
        cards: [
          { title: "One", points: ["a", "", "b", "c", "d", "e", "f"] },
          { title: "   ", points: [] },
          { title: "Two", points: [] },
          { title: "Three", points: [] },
        ],
      },
      2,
    );
    expect(outline.title).toBe("Untitled");
    expect(outline.cards.map((c) => c.title)).toEqual(["One", "Two"]);
    expect(outline.cards[0].points).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("parseStored", () => {
  it("returns null for empty, invalid JSON or the wrong shape", () => {
    expect(parseStored(CardContentSchema, "")).toBeNull();
    expect(parseStored(CardContentSchema, "{oops")).toBeNull();
    expect(parseStored(CardContentSchema, JSON.stringify({ title: "x" }))).toBeNull();
  });

  it("parses valid content", () => {
    expect(parseStored(CardContentSchema, JSON.stringify(base))?.title).toBe("Why now");
  });
});

describe("card photos", () => {
  const photo = { url: "https://images.pexels.com/photos/1/a.jpeg", alt: "Pizza", credit: "Ana", creditUrl: "https://www.pexels.com/photo/1" };

  it("keeps Pexels photos and drops photos from anywhere else", () => {
    expect(normalizeCard({ ...base, image: photo }).image?.url).toBe(photo.url);
    expect(normalizeCard({ ...base, image: { ...photo, url: "https://evil.example.com/x.jpg" } }).image).toBeNull();
    expect(normalizeCard({ ...base, image: { ...photo, url: "javascript:alert(1)" } }).image).toBeNull();
    expect(normalizeCard({ ...base, image: { ...photo, creditUrl: "javascript:alert(1)" } }).image?.creditUrl).toBe("");
  });

  it("only shows photos on layouts with room for them", () => {
    expect(showsImage(normalizeCard({ ...base, layout: "bullets", image: photo }))).toBe(true);
    expect(showsImage(normalizeCard({ ...base, layout: "stats", image: photo }))).toBe(false);
    expect(showsImage(normalizeCard(base))).toBe(false);
  });

  it("serves photos through the same-origin image route", () => {
    expect(imageSrc(photo.url)).toBe(`/api/image?src=${encodeURIComponent(photo.url)}`);
  });
});

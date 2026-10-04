import { describe, expect, it } from "vitest";

import { CardContentSchema, imageSrc, isProxyableImageUrl, normalizeCard, normalizeOutline, parseStored, showsImage, type GeneratedCard } from "../cards";

const base: GeneratedCard = {
  layout: "bullets",
  eyebrow: "",
  icon: "🚀",
  title: "Why now",
  subtitle: "",
  items: [],
  stats: [],
  quote: "",
  quoteAuthor: "",
  table: { columns: [], rows: [] },
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

describe("labels and tables", () => {
  it("keeps a short label and reads older cards without one", () => {
    expect(normalizeCard({ ...base, eyebrow: "  2014 · Brazil " }).eyebrow).toBe("2014 · Brazil");
    const old = { ...base } as Record<string, unknown>;
    delete old.eyebrow;
    delete old.table;
    delete old.imageQuery;
    const parsed = parseStored(CardContentSchema, JSON.stringify(old));
    expect(parsed?.eyebrow).toBe("");
    expect(parsed?.table).toEqual({ columns: [], rows: [] });
  });

  it("caps tables and pads short rows to the column count", () => {
    const card = normalizeCard({
      ...base,
      layout: "table",
      table: {
        columns: ["A", "B", "C", "D", "E"],
        rows: [["1", "2"], ["", "", ""], ...Array.from({ length: 9 }, (_, i) => [`r${i}`, "x", "y", "z", "extra"])],
      },
    });
    expect(card.layout).toBe("table");
    expect(card.table.columns).toEqual(["A", "B", "C", "D"]);
    expect(card.table.rows[0]).toEqual(["1", "2", "", ""]);
    expect(card.table.rows).toHaveLength(7);
    expect(card.table.rows.every((r) => r.length === 4)).toBe(true);
  });

  it("turns a table card without rows into a list", () => {
    expect(normalizeCard({ ...base, layout: "table" }).layout).toBe("bullets");
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

  it("keeps photos from the searched sources and drops photos from anywhere else", () => {
    expect(normalizeCard({ ...base, image: photo }).image?.url).toBe(photo.url);
    for (const url of ["https://live.staticflickr.com/1/2_b.jpg", "https://farm4.staticflickr.com/1/2.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/bc/x.jpg"]) {
      expect(normalizeCard({ ...base, image: { ...photo, url } }).image?.url).toBe(url);
    }
    expect(normalizeCard({ ...base, image: { ...photo, url: "http://live.staticflickr.com/1/2_b.jpg" } }).image).toBeNull();
    expect(normalizeCard({ ...base, image: { ...photo, url: "https://staticflickr.com.evil.example/x.jpg" } }).image).toBeNull();
    expect(normalizeCard({ ...base, image: { ...photo, url: "https://evil.example.com/x.jpg" } }).image).toBeNull();
    expect(normalizeCard({ ...base, image: { ...photo, url: "javascript:alert(1)" } }).image).toBeNull();
    expect(normalizeCard({ ...base, image: { ...photo, creditUrl: "javascript:alert(1)" } }).image?.creditUrl).toBe("");
  });

  it("only shows photos on layouts with room for them", () => {
    expect(showsImage(normalizeCard({ ...base, layout: "bullets", image: photo }))).toBe(true);
    expect(showsImage(normalizeCard({ ...base, layout: "stats", image: photo }))).toBe(true);
    expect(showsImage(normalizeCard({ ...base, layout: "columns", image: photo }))).toBe(false);
    expect(showsImage(normalizeCard(base))).toBe(false);
  });

  it("lets the image route fetch Openverse thumbnails but nothing else from that host", () => {
    expect(isProxyableImageUrl("https://api.openverse.org/v1/images/8bb3bfcc-0ca0-4394-bc4a-81c7a2e21741/thumb/")).toBe(true);
    expect(isProxyableImageUrl("https://api.openverse.org/v1/images/?q=x")).toBe(false);
    expect(isProxyableImageUrl("https://api.openverse.org/v1/auth_tokens/token/")).toBe(false);
    expect(isProxyableImageUrl("https://images.pexels.com/photos/1/a.jpeg")).toBe(true);
  });

  it("serves photos through the same-origin image route", () => {
    expect(imageSrc(photo.url)).toBe(`/api/image?src=${encodeURIComponent(photo.url)}`);
  });
});

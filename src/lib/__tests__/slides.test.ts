import { describe, expect, it } from "vitest";

import { CardContentSchema, type CardContent } from "../cards";
import { DEFAULT_LOOK, deckSlides } from "../slides";

const photo = (credit: string, url = "https://commons.wikimedia.org/wiki/File:X.jpg"): CardContent =>
  CardContentSchema.parse({
    layout: "bullets",
    icon: "",
    title: "t",
    subtitle: "",
    items: [{ heading: "a", text: "b" }],
    stats: [],
    quote: "",
    quoteAuthor: "",
    image: { url: "https://upload.wikimedia.org/x.jpg", alt: "", credit, creditUrl: url },
  });

describe("deck slides", () => {
  it("keeps credits on the photos by default and adds nothing", () => {
    const cards = [photo("Ann (CC BY 4.0)")];
    expect(deckSlides(cards, DEFAULT_LOOK)).toEqual(cards);
  });

  it("moves every credit to a credits slide at the end", () => {
    const cards = [photo("Ann (CC BY 4.0)"), photo("Bo (CC0)", "https://www.flickr.com/photos/bo/1")];
    const slides = deckSlides(cards, { ...DEFAULT_LOOK, credits: "end" });
    expect(slides).toHaveLength(3);
    expect(slides[0].image?.credit).toBe("");
    expect(slides[2].table.rows).toEqual([
      ["1", "Ann (CC BY 4.0) · Wikimedia Commons"],
      ["2", "Bo (CC0) · Flickr"],
    ]);
  });

  it("adds the closing slide when asked", () => {
    const slides = deckSlides([photo("Ann (CC BY 4.0)")], { ...DEFAULT_LOOK, endSlide: true });
    expect(slides.at(-1)?.title).toBe("Made with *Slidezza*");
  });
});

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { CardContentSchema, clipAtBreak, removeCitations, type CardContent } from "../cards";
import { cleanArtist } from "../images";

const card = (patch: Partial<CardContent>): CardContent =>
  CardContentSchema.parse({ layout: "bullets", icon: "", title: "Plaque", subtitle: "", items: [], stats: [], quote: "", quoteAuthor: "", ...patch });

describe("citations in slide text", () => {
  const labels = ["Tooth decay", "who.int", "pmc.ncbi.nlm.nih.gov"];

  it("removes the source labels the model copies from the sources, as in the dental deck", () => {
    const c = card({
      subtitle: "Bacteria turn sugars into acids [who.int].",
      items: [
        { heading: "Sugar", text: "There is a clear relationship between sugars and caries [who.int]." },
        { heading: "Economies", text: "The disease is most common in the developed world [Tooth decay]. It persists [pmc.ncbi.nlm.nih.gov]." },
        { heading: "Mixed", text: "Fluoride helps [who.int, Tooth decay] (Source: who.int)." },
      ],
    });
    const out = removeCitations(c, labels);
    expect(out.subtitle).toBe("Bacteria turn sugars into acids.");
    expect(out.items.map((i) => i.text)).toEqual([
      "There is a clear relationship between sugars and caries.",
      "The disease is most common in the developed world. It persists.",
      "Fluoride helps.",
    ]);
  });

  it("keeps placeholders for the user and ordinary brackets", () => {
    const c = card({ items: [{ heading: "Goal", text: "Grow [monthly revenue] by [launch date]." }, { heading: "Note", text: "Teeth [and gums] matter." }] });
    expect(removeCitations(c, labels).items.map((i) => i.text)).toEqual(["Grow [monthly revenue] by [launch date].", "Teeth [and gums] matter."]);
  });

  it("removes web addresses in brackets even when they aren't listed", () => {
    expect(removeCitations(card({ subtitle: "Brush twice a day [ada.org]." }), []).subtitle).toBe("Brush twice a day.");
  });
});

describe("table cells", () => {
  it("end at a natural break instead of mid-word", () => {
    const cell = "Removing decay, creating a geometrically perfect cavity, and placing an artificial filling material in it";
    const out = clipAtBreak(cell, 80);
    expect(out).toBe("Removing decay, creating a geometrically perfect cavity");
    expect(out).not.toContain("…");
    expect(clipAtBreak("Short cell", 80)).toBe("Short cell");
  });
});

describe("photo credits", () => {
  it("keep only the photographer's name from Commons boilerplate", () => {
    expect(cleanArtist("No machine-readable author provided. Wsiegmund assumed (based on copyright claims).")).toBe("Wsiegmund");
    expect(cleanArtist("Original uploaded by DRosenbach (Transfered by wikiLeon)")).toBe("DRosenbach");
    expect(cleanArtist("Suyash.dwivedi")).toBe("Suyash.dwivedi");
    expect(cleanArtist("Own work")).toBe("");
  });
});

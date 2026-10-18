import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { CardContentSchema, clipAtBreak, normalizeCard, removeCitations, type CardContent } from "../cards";
import { cleanArtist, looksGraphic, looksLikeFigure } from "../images";
import { stripUnverified, verifyCard } from "../factcheck";
import type { SourceText } from "../research";

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

describe("photos", () => {
  it("skip charts, diagrams and scans, which a photo frame would crop", () => {
    expect(looksLikeFigure("File:Sugar consumption and caries graph.png")).toBe(true);
    expect(looksLikeFigure("File:Tooth_anatomy_diagram.svg")).toBe(true);
    expect(looksLikeFigure("Bitewing radiograph showing caries")).toBe(true);
    expect(looksLikeFigure("File:Dentist examining a patient.jpg")).toBe(false);
  });
});

describe("stat labels", () => {
  it("end at a break, never mid-sentence with an ellipsis", () => {
    const c = normalizeCard({
      layout: "stats", icon: "", title: "t", subtitle: "", items: [], quote: "", quoteAuthor: "",
      stats: [{ value: "20%", label: "of children in the United States and Europe, who carry most of the disease burden, across all income groups studied" }],
    });
    expect(c.stats[0].label).toBe("of children in the United States and Europe, who carry most of the disease burden");
  });
});

describe("removing a failed sentence", () => {
  it("keeps whole sentences and starts the rest with a capital", () => {
    const texts: SourceText[] = [{ title: "a.org", text: "Fluoride toothpaste reduces caries. Sealants protect grooves.", group: "a.org" }];
    const c = CardContentSchema.parse({
      layout: "bullets", icon: "", title: "Fluoride", subtitle: "", stats: [], quote: "", quoteAuthor: "",
      items: [
        { heading: "Toothpaste", text: "A 9999 ppm paste is standard; higher concentrations add protection. Fluoride toothpaste reduces caries." },
        { heading: "Sealants", text: "Sealants protect grooves in the back teeth." },
      ],
    });
    const out = stripUnverified(c, verifyCard(c, texts, ""), "Fluoride");
    expect(out.items[0].text).toBe("Fluoride toothpaste reduces caries.");
  });
});

describe("graphic photos", () => {
  it("are recognised from captions and file names", () => {
    expect(looksGraphic("Mercury poisoning victim, 1890s")).toBe(true);
    expect(looksGraphic("File:Severe_tooth_decay.jpg")).toBe(true);
    expect(looksGraphic("Patients with facial deformity")).toBe(true);
    expect(looksGraphic("Dentist examining a child's teeth")).toBe(false);
    expect(looksGraphic("Dental amalgam capsules")).toBe(false);
  });
});

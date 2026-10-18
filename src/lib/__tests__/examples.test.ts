import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import type { CardContent } from "../cards";
import { exampleDescription, exampleSlug, exampleTitle } from "../examples";
import { INDEXNOW_KEY } from "../indexnow";

const card = (title: string, layout: CardContent["layout"] = "bullets") => ({ layout, title }) as CardContent;

describe("example pages", () => {
  it("make readable addresses that say presentation once", () => {
    expect(exampleSlug("Photosynthesis: how plants make food")).toBe("photosynthesis-how-plants-make-food-presentation");
    expect(exampleSlug("Café & Crème")).toBe("cafe-and-creme-presentation");
    expect(exampleSlug("Dental caries presentation")).toBe("dental-caries-presentation");
    expect(exampleSlug("!!!")).toBe("");
    const long = exampleSlug("The extraordinarily long history of the transatlantic telegraph cable and its many failures");
    expect(long.length).toBeLessThanOrEqual(84);
    expect(long).toMatch(/^the-extraordinarily-long-history-of-the-transatlantic-telegraph-cable-presentation$/);
  });

  it("titles and descriptions fit search results", () => {
    expect(exampleTitle("Dental caries")).toBe("Dental caries presentation");
    expect(exampleTitle("Mercury toxicity slides")).toBe("Mercury toxicity slides");
    const description = exampleDescription("Dental caries", [card("Dental caries", "title"), card("Causes"), card("Part 2", "section"), card("Prevention")]);
    expect(description).toBe("A 4-slide example presentation on Dental caries: Causes, Prevention. View it free or make your own.");
    const many = exampleDescription("X", Array.from({ length: 12 }, (_, i) => card(`A fairly long slide title number ${i}`)));
    expect(many.length).toBeLessThanOrEqual(170);
  });

  it("the IndexNow key file is published", () => {
    expect(existsSync(new URL(`../../../public/${INDEXNOW_KEY}.txt`, import.meta.url))).toBe(true);
  });
});

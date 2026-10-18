import { describe, expect, it } from "vitest";

import { DEFAULT_STYLE, STYLES, LAYOUTS, CardBriefSchema, PlannedOutlineSchema, cleanBrief, isStyle, normalizeOutline, parseStyle, type CardBrief } from "../cards";
import { effectiveDensity, inferLayout, layoutsOf, planDeck, splitBrief } from "../plan";

const brief = (title: string, extra: Partial<CardBrief> = {}): CardBrief => ({ title, points: [], ...extra });

describe("presentation style", () => {
  it("has three styles and Auto is the default", () => {
    expect(STYLES).toEqual(["auto", "visual", "detailed"]);
    expect(DEFAULT_STYLE).toBe("auto");
  });

  it("accepts only known styles and treats everything else as Auto (older requests and decks have none)", () => {
    expect(parseStyle("visual")).toBe("visual");
    expect(parseStyle("detailed")).toBe("detailed");
    for (const bad of [undefined, null, "", "VISUAL", "fancy", 3, {}, ["visual"]]) expect(parseStyle(bad)).toBe("auto");
    expect(isStyle("auto")).toBe(true);
    expect(isStyle("other")).toBe(false);
  });
});

describe("splitBrief", () => {
  it("separates topic, audience and focus", () => {
    expect(splitBrief("Water on Mars\n\nAudience: Students: easy to follow\nFocus: The big picture")).toEqual({
      topic: "Water on Mars",
      audience: "Students: easy to follow",
      focus: "The big picture",
    });
  });

  it("treats a prompt without those lines as all topic", () => {
    expect(splitBrief("Just a topic")).toEqual({ topic: "Just a topic", audience: "", focus: "" });
  });
});

describe("content depth", () => {
  it("uses the detail level as the baseline and the plan on Medium", () => {
    expect(effectiveDensity("low", "rich")).toBe("light");
    expect(effectiveDensity("high", "light")).toBe("rich");
    expect(effectiveDensity("medium", "light")).toBe("light");
    expect(effectiveDensity("medium", "rich")).toBe("rich");
  });

  it("keeps decks from before the plan on what Medium always meant", () => {
    expect(effectiveDensity("medium", undefined)).toBe("standard");
    expect(effectiveDensity("medium", "huge")).toBe("standard");
  });
});

describe("planning the cards", () => {
  const options = { style: "auto" as const, grounded: true };

  it("keeps only layouts the renderer supports, and plans the cover as the title card", () => {
    const plan = planDeck(
      [brief("Cover", { layout: "bullets" }), brief("A", { layout: "carousel" }), brief("B", { layout: "STATS" }), brief("C", { layout: "steps", points: ["a", "b", "c"] }), brief("End")],
      options,
    );
    for (const card of plan) expect(LAYOUTS as readonly string[]).toContain(card.layout);
    expect(plan[0].layout).toBe("title");
    expect(plan[2].layout).toBe("stats"); // case is ignored
    expect(plan[3].layout).toBe("timeline"); // a known synonym
  });

  it("never uses the title layout after the cover, and dividers only in long decks", () => {
    const short = planDeck([brief("Cover"), brief("A", { layout: "title" }), brief("B", { layout: "section" }), brief("End")], options);
    expect(layoutsOf(short).slice(1)).not.toContain("title");
    expect(layoutsOf(short).slice(1)).not.toContain("section");
    const long = planDeck([brief("Cover"), ...Array.from({ length: 9 }, (_, i) => brief(`Part ${i}`, { layout: i === 3 ? "section" : "bullets" })), brief("End")], options);
    expect(long[4].layout).toBe("section");
  });

  it("allows a quote only when the deck has sources, and only one", () => {
    const cards = [brief("Cover"), brief("Q1", { layout: "quote" }), brief("Q2", { layout: "quote" }), brief("End")];
    expect(layoutsOf(planDeck(cards, { style: "auto", grounded: false }))).not.toContain("quote");
    expect(layoutsOf(planDeck(cards, options)).filter((l) => l === "quote")).toHaveLength(1);
  });

  it("breaks a run of three identical layouts", () => {
    const cards = [brief("Cover"), ...["a", "b", "c", "d"].map((t) => brief(t, { layout: "bullets", points: ["one", "two", "three"] })), brief("End", { layout: "bullets" })];
    const layouts = layoutsOf(planDeck(cards, options));
    for (let i = 2; i < layouts.length; i++) expect(layouts[i] === layouts[i - 1] && layouts[i] === layouts[i - 2]).toBe(false);
  });

  it("breaks a long run of the same layout even when the plan has no content cues (a model that lists everything)", () => {
    const cards = [brief("Cover"), ...Array.from({ length: 5 }, (_, i) => brief(`Part ${i + 1}`, { layout: "bullets" })), brief("End", { layout: "bullets" })];
    const layouts = layoutsOf(planDeck(cards, options));
    expect(layouts.filter((l) => l === "columns").length).toBeGreaterThan(0);
    for (let i = 2; i < layouts.length; i++) expect(layouts[i] === layouts[i - 1] && layouts[i] === layouts[i - 2]).toBe(false);
  });

  it("varies two plain list slides in a row when another layout fits the content", () => {
    const cards = [
      brief("Cover"),
      brief("Options", { layout: "bullets", points: ["x", "y", "z"], purpose: "compare options" }),
      brief("Trade-offs", { layout: "bullets", points: ["x", "y", "z"], purpose: "compare the trade-offs" }),
      brief("End", { layout: "bullets" }),
    ];
    expect(planDeck(cards, options)[2].layout).toBe("columns");
  });

  it("leaves repetition alone when nothing fits better, or the repeated layout suits the content", () => {
    const plain = planDeck([brief("Cover"), brief("A", { layout: "bullets", points: ["alpha", "beta", "gamma", "delta"] }), brief("B", { layout: "bullets", points: ["alpha", "beta", "gamma", "delta"] }), brief("End", { layout: "columns" })], options);
    expect(layoutsOf(plain).slice(1, 3)).toEqual(["bullets", "bullets"]);
    const timelines = planDeck(
      [brief("Cover"), brief("Early years", { layout: "timeline", points: ["1", "2", "3"] }), brief("Later years", { layout: "timeline", points: ["1", "2", "3"] }), brief("End")],
      options,
    );
    expect(layoutsOf(timelines).slice(1, 3)).toEqual(["timeline", "timeline"]);
  });

  it("plans cards from before the plan existed (no layout) from their words, without failing", () => {
    const plan = planDeck([brief("Welcome"), brief("How it works", { points: ["Step one", "Step two", "Step three"] }), brief("Next steps")], options);
    expect(plan.every((c) => LAYOUTS.includes(c.layout as (typeof LAYOUTS)[number]))).toBe(true);
    expect(plan[1].layout).toBe("timeline");
  });

  it("makes a deck that was all bullets less repetitive (simulated model output)", () => {
    const run = (layouts: string[]) => Math.max(...layouts.map((_, i) => { let n = 1; while (i + n < layouts.length && layouts[i + n] === layouts[i]) n++; return n; }));
    const model = [
      brief("Cover"),
      brief("Problem", { layout: "bullets", points: ["a", "b", "c"] }),
      brief("Options", { layout: "bullets", points: ["a", "b", "c"], purpose: "compare options" }),
      brief("History", { layout: "bullets", points: ["1990 a", "2000 b", "2010 c"], purpose: "history of the idea" }),
      brief("Results", { layout: "bullets", points: ["up 20%", "cut 15%", "saved 3 hours"], evidence: true }),
      brief("Risks", { layout: "bullets", points: ["a", "b", "c", "d"] }),
      brief("Takeaway", { layout: "bullets" }),
    ];
    const before = layoutsOf(model.map((c, i) => ({ ...c, layout: i === 0 ? "title" : "bullets" })));
    const after = layoutsOf(planDeck(model, options));
    expect(run(after)).toBeLessThan(run(before));
    expect(new Set(after).size).toBeGreaterThan(new Set(before).size);
  });

  it("sets content depth by style", () => {
    const cards = [brief("Cover"), brief("Idea", { contentDepth: "rich" }), brief("Short", { contentDepth: "light" }), brief("Missing")];
    expect(planDeck(cards, { style: "visual", grounded: true }).map((c) => c.contentDepth)).toEqual(["light", "standard", "light", "light"]);
    expect(planDeck(cards, { style: "detailed", grounded: true }).map((c) => c.contentDepth)).toEqual(["rich", "rich", "standard", "rich"]);
    expect(planDeck(cards, { style: "auto", grounded: true }).map((c) => c.contentDepth)).toEqual(["standard", "rich", "light", "standard"]);
  });

  it("does not invent evidence flags beyond whether the deck has sources", () => {
    expect(planDeck([brief("Cover"), brief("A")], { style: "auto", grounded: false }).map((c) => c.evidence)).toEqual([false, false]);
    expect(planDeck([brief("Cover"), brief("A", { evidence: false })], { style: "auto", grounded: true }).map((c) => c.evidence)).toEqual([true, false]);
  });

  it("infers a sensible layout from the words of a card", () => {
    expect(inferLayout(brief("Compare", { purpose: "compare two options", points: ["a", "b"] }))).toBe("columns");
    expect(inferLayout(brief("Results", { points: ["up 20%", "down 3%"], evidence: true }))).toBe("stats");
    expect(inferLayout(brief("Why it matters", { points: ["a", "b"] }))).toBe("bullets");
  });
});

describe("outline schemas", () => {
  it("lets older stored briefs (title and points only) parse", () => {
    expect(CardBriefSchema.safeParse({ title: "Old", points: ["a"] }).success).toBe(true);
  });

  it("asks the model for every plan field", () => {
    const keys = Object.keys(PlannedOutlineSchema.shape.cards.element.shape);
    expect(keys).toEqual(expect.arrayContaining(["title", "purpose", "keyMessage", "points", "layout", "contentDepth", "visual", "evidence", "after"]));
  });

  it("cleans plan fields and drops what isn't valid, without inventing any", () => {
    expect(cleanBrief({ title: " T ", points: ["a", 3, ""] as unknown as string[], contentDepth: "HUGE", layout: " Bullets ", evidence: "yes" as unknown as boolean })).toEqual({
      title: "T",
      points: ["a"],
      layout: "bullets",
    });
    expect(cleanBrief({ title: "T", points: [], keyMessage: "  One  idea ", contentDepth: "Rich", evidence: false, after: "" })).toEqual({
      title: "T",
      points: [],
      keyMessage: "One idea",
      contentDepth: "rich",
      evidence: false,
    });
  });

  it("keeps the plan through normalizeOutline", () => {
    const outline = normalizeOutline({ title: "x", cards: [{ title: "A", points: [], purpose: "show the problem", keyMessage: "Time is lost", visual: "none", evidence: true, after: "" }] }, 3);
    expect(outline.cards[0]).toMatchObject({ purpose: "show the problem", keyMessage: "Time is lost", visual: "none", evidence: true });
  });
});

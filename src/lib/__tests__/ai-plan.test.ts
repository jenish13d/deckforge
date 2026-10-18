import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DENSITY_RULES, choiceForMode, deckContext, generateCard, generateOutline, type CallModel, type ModelRequest } from "../ai";
import { PlannedOutlineSchema, type CardBrief } from "../cards";

beforeEach(() => vi.stubEnv("DEMO_AI", "")); // CI runs in demo mode; these tests check the real path
afterEach(() => vi.unstubAllEnvs());

type Handler = (request: ModelRequest<unknown>, n: number) => unknown;

function scripted(handler: Handler) {
  const requests: ModelRequest<unknown>[] = [];
  const call = (async (request: ModelRequest<unknown>) => {
    requests.push(request);
    return handler(request, requests.length);
  }) as CallModel;
  return { call, requests };
}

const plannedCard = (over: Record<string, unknown> = {}) => ({
  title: "Card",
  purpose: "show the problem",
  keyMessage: "Radiologists are overloaded",
  points: ["a", "b"],
  layout: "bullets",
  contentDepth: "standard",
  visual: "none",
  evidence: false,
  after: "",
  ...over,
});

const modelOutline = (cards: Record<string, unknown>[]) => ({ title: "AI in healthcare", cards });

const outlineModel = (cards: Record<string, unknown>[]) =>
  scripted((request) => (request.role === "research" ? { factual: false, searches: [] } : modelOutline(cards)));

const BRIEF = "AI in healthcare\n\nAudience: Hospital managers: what it means for budgets\nFocus: Practical applications";

describe("outline planning", () => {
  it("plans the whole deck in the existing outline call (no extra AI call)", async () => {
    const { call, requests } = outlineModel([plannedCard({ title: "Cover" }), plannedCard({ title: "Problem" }), plannedCard({ title: "Takeaway" })]);
    await generateOutline(BRIEF, 3, call);
    expect(requests.map((r) => r.role)).toEqual(["research", "outline"]); // exactly what it was before
    expect(requests[1].schema).toBe(PlannedOutlineSchema);
  });

  it("sends the style, audience and purpose, and Auto when no style is given", async () => {
    const auto = outlineModel([plannedCard({ title: "Cover" }), plannedCard(), plannedCard()]);
    await generateOutline(BRIEF, 3, auto.call);
    const request = auto.requests.find((r) => r.role === "outline")!;
    expect(request.user).toContain("Presentation style: auto");
    expect(request.user).toContain("Audience: Hospital managers: what it means for budgets");
    expect(request.user).toContain("Purpose and focus: Practical applications");
    expect(request.instructions).toContain("Style: AUTO");
    expect(request.instructions).toContain("beginning");
    expect(request.instructions).toContain("meaningful takeaway");

    for (const [style, marker] of [["visual", "Style: VISUAL"], ["detailed", "Style: DETAILED"]] as const) {
      const { call, requests } = outlineModel([plannedCard({ title: "Cover" }), plannedCard(), plannedCard()]);
      await generateOutline(BRIEF, 3, call, { style });
      expect(requests.find((r) => r.role === "outline")!.instructions).toContain(marker);
      expect(requests.find((r) => r.role === "outline")!.user).toContain(`Presentation style: ${style}`);
    }
  });

  it("treats an unknown style as Auto", async () => {
    const { call, requests } = outlineModel([plannedCard({ title: "Cover" }), plannedCard(), plannedCard()]);
    await generateOutline(BRIEF, 3, call, { style: "wild" as never });
    expect(requests.find((r) => r.role === "outline")!.user).toContain("Presentation style: auto");
  });

  it("validates and balances the model's plan in code", async () => {
    const { call } = outlineModel([
      plannedCard({ title: "Cover", layout: "bullets" }),
      plannedCard({ title: "Problem", layout: "hologram" }),
      plannedCard({ title: "Evidence", layout: "title", evidence: true, contentDepth: "enormous" }),
      plannedCard({ title: "Takeaway", layout: "section" }),
    ]);
    const outline = await generateOutline(BRIEF, 4, call);
    expect(outline.cards[0].layout).toBe("title");
    for (const c of outline.cards.slice(1)) expect(["bullets", "columns", "stats", "timeline", "table", "quote"]).toContain(c.layout);
    expect(outline.cards[2].contentDepth).toBe("standard");
    expect(outline.cards.map((c) => c.keyMessage)).toEqual(Array(4).fill("Radiologists are overloaded"));
  });

  it("still accepts an outline from a model that only returns titles and points", async () => {
    const { call } = outlineModel([{ title: "Cover", points: [] }, { title: "A", points: ["x"] }, { title: "B", points: [] }]);
    const outline = await generateOutline("Pitch", 3, call);
    expect(outline.cards).toHaveLength(3);
    expect(outline.cards[0].layout).toBe("title");
  });
});

describe("slide writing uses the plan", () => {
  const outline: CardBrief[] = [
    { title: "AI in healthcare", points: [], layout: "title", keyMessage: "What managers should know", contentDepth: "light", evidence: false },
    { title: "The problem", points: ["scan backlog"], purpose: "show the problem", keyMessage: "Radiologists are overloaded with scans", layout: "stats", contentDepth: "standard", visual: "a radiologist at a screen", evidence: true, after: "sets the scene" },
    { title: "A real application", points: [], purpose: "show a use", keyMessage: "Urgent scans are flagged for review first", layout: "bullets", contentDepth: "rich", visual: "none", evidence: false, after: "answers the problem" },
    { title: "What to do next", points: [], purpose: "advise", keyMessage: "Pilot in one department", layout: "bullets", evidence: false },
  ];
  const card = {
    layout: "bullets", eyebrow: "", icon: "", title: "Urgent cases reach a doctor sooner", subtitle: "",
    items: [
      { heading: "Prioritised queue", text: "Urgent scans are flagged so a specialist reviews them before the routine ones." },
      { heading: "Human decision", text: "A clinician always confirms every flagged result before any patient is told." },
      { heading: "Notes attached", text: "The model's notes travel with each scan so the reviewer sees why it was flagged." },
    ],
    stats: [], quote: "", quoteAuthor: "", table: { columns: [], rows: [] }, imageQuery: "",
  };

  it("gives the card its audience, style, role, key message, supporting points, layout, depth and visual direction", async () => {
    const { call, requests } = scripted(() => card);
    await generateCard({ deckTitle: "AI in healthcare", prompt: BRIEF, outline, index: 1, mode: "standard", style: "visual" }, call);
    const [request] = requests;
    expect(request.context).toContain("Audience: Hospital managers: what it means for budgets");
    expect(request.context).toContain("Purpose and focus: Practical applications");
    expect(request.context).toContain("Presentation style: visual");
    expect(request.context).toContain("2. The problem [stats]: Radiologists are overloaded with scans"); // the whole story, compactly
    expect(request.instructions).toContain("Style: VISUAL");
    expect(request.instructions).toContain("Serve the audience");
    expect(request.user).toContain('card 2 of 4: "The problem"');
    expect(request.user).toContain("Role in the story: show the problem.");
    expect(request.user).toContain("Key message (the one idea of this card): Radiologists are overloaded with scans");
    expect(request.user).toContain("Supporting points: scan backlog.");
    expect(request.user).toContain('Use the planned layout "stats"');
    expect(request.user).toContain("Visual direction: a radiologist at a screen.");
    expect(request.user).toContain("every fact must come from the SOURCES");
    expect(request.user).toContain(DENSITY_RULES.standard);
  });

  it("uses each card's planned depth, and the Pro detail level overrides it", async () => {
    const { call, requests } = scripted(() => card);
    await generateCard({ deckTitle: "d", prompt: BRIEF, outline, index: 2, mode: "standard" }, call);
    await generateCard({ deckTitle: "d", prompt: BRIEF, outline, index: 2, mode: "standard", depth: "low" }, call);
    await generateCard({ deckTitle: "d", prompt: BRIEF, outline, index: 0, mode: "standard", depth: "high" }, call);
    expect(requests[0].user).toContain(DENSITY_RULES.rich);
    expect(requests[1].user).toContain(DENSITY_RULES.light);
    expect(requests[2].user).toContain(DENSITY_RULES.rich);
    expect(requests[2].user).toContain('"title" layout'); // the cover is still the cover
  });

  it("labels conceptual cards as such, so an invented example isn't taken for a real event", async () => {
    const { call, requests } = scripted(() => card);
    await generateCard({ deckTitle: "d", prompt: BRIEF, outline, index: 2, mode: "standard" }, call);
    expect(requests[0].user).toContain("explains an idea, process or example");
    expect(requests[0].user).toContain("labelled as illustrative");
    expect(requests[0].instructions).toContain("must be marked as one"); // the ungrounded rules
  });

  it("keeps the planned layout instead of re-deciding it from the previous card", async () => {
    const timeline = { ...card, layout: "timeline", items: card.items.slice(0, 2) };
    const planned: CardBrief[] = [outline[0], { ...outline[1], layout: "timeline" }, { ...outline[2], layout: "timeline" }];
    const { call, requests } = scripted(() => timeline);
    const result = await generateCard({ deckTitle: "d", prompt: BRIEF, outline: planned, index: 2, mode: "standard", previousLayout: "timeline", factCheck: false }, call);
    expect(result.card.layout).toBe("timeline"); // the plan said so; no database-state-dependent switch
    expect(requests[0].user).not.toContain("choose a different one");
  });

  it("works exactly as before for a deck made before the plan existed", async () => {
    const old: CardBrief[] = [{ title: "Welcome", points: ["Who we are"] }, { title: "The problem", points: ["Meal prep takes hours"] }, { title: "Next steps", points: [] }];
    const { call, requests } = scripted(() => card);
    await generateCard({ deckTitle: "Meal prep", prompt: "Pitch for meal prep", outline: old, index: 1, mode: "standard", previousLayout: "bullets" }, call);
    expect(requests[0].user).toContain('card 2 of 3: "The problem"');
    expect(requests[0].user).toContain("Key points: Meal prep takes hours.");
    expect(requests[0].user).not.toContain("Role in the story");
    expect(requests[0].user).toContain('previous card used the "bullets" layout');
    expect(requests[0].user).toContain(DENSITY_RULES.standard); // Medium meant "standard" before, and still does
    expect(requests[0].context).toContain("Presentation style: auto");
  });

  it("keeps the instructions identical across the cards of a deck, and the context too", async () => {
    const { call, requests } = scripted(() => card);
    for (const index of [0, 1, 2, 3]) await generateCard({ deckTitle: "d", prompt: BRIEF, outline, index, mode: "standard", style: "detailed" }, call);
    expect(new Set(requests.map((r) => r.instructions)).size).toBe(1);
    expect(new Set(requests.map((r) => r.context)).size).toBe(1);
    expect(requests[0].context).toBe(deckContext("d", BRIEF, outline, "detailed"));
  });

  it("changes the instructions with the style, not with Quick or Standard", async () => {
    const { call, requests } = scripted(() => card);
    await generateCard({ deckTitle: "d", prompt: BRIEF, outline, index: 1, mode: "quick", style: "visual" }, call);
    await generateCard({ deckTitle: "d", prompt: BRIEF, outline, index: 1, mode: "standard", style: "visual" }, call);
    await generateCard({ deckTitle: "d", prompt: BRIEF, outline, index: 1, mode: "standard", style: "detailed" }, call);
    expect(requests[0].instructions).toBe(requests[1].instructions);
    expect(requests[1].instructions).not.toBe(requests[2].instructions);
    expect(requests[0].model).toBe(choiceForMode("quick").model);
    expect(requests[1].model).toBe(choiceForMode("standard").model);
  });

  it("asks the model to cite sources only in detailed decks", async () => {
    const { call, requests } = scripted(() => card);
    await generateCard({ deckTitle: "d", prompt: BRIEF, outline, index: 1, mode: "standard", style: "detailed" }, call);
    await generateCard({ deckTitle: "d", prompt: BRIEF, outline, index: 1, mode: "standard", style: "visual" }, call);
    expect(requests[0].instructions).toContain("name where an important factual claim comes from");
    expect(requests[1].instructions).not.toContain("name where an important factual claim comes from");
  });
});

describe("one rewrite for a weak card, and no more", () => {
  const outline: CardBrief[] = [
    { title: "Cover", points: [] },
    { title: "Faster triage", points: [], keyMessage: "Urgent scans are flagged so a specialist reviews them first", evidence: false, layout: "bullets" },
    { title: "End", points: [] },
  ];
  const base = { layout: "bullets", eyebrow: "", icon: "", subtitle: "", stats: [], quote: "", quoteAuthor: "", table: { columns: [], rows: [] }, imageQuery: "" };
  const strong = { ...base, title: "Urgent cases reach a doctor sooner", items: [
    { heading: "Prioritised queue", text: "Urgent scans are flagged by the model, so a specialist reviews them before the routine ones." },
    { heading: "Human decision", text: "A clinician always confirms every flagged result before any patient is told about it." },
    { heading: "Notes attached", text: "The model's notes travel with each scan so the reviewer can see why it was flagged." },
  ] };
  const weak = { ...base, title: "Faster triage", items: [
    { heading: "A", text: "AI plays a crucial role." }, { heading: "B", text: "It is very important." }, { heading: "C", text: "Many benefits exist." },
  ] };
  const args = { deckTitle: "d", prompt: "AI in healthcare", outline, index: 1, mode: "standard" as const, factCheck: false };

  it("makes one call for a good card, including a conceptual card with no numbers", async () => {
    const { call, requests } = scripted(() => strong);
    const result = await generateCard(args, call);
    expect(requests).toHaveLength(1);
    expect(result.card.items).toHaveLength(3);
  });

  it("sends a weak card back once, tells the model what was wrong, and keeps the better version", async () => {
    const { call, requests } = scripted((_r, n) => (n === 1 ? weak : strong));
    const result = await generateCard(args, call);
    expect(requests).toHaveLength(2);
    expect(requests[1].user).toContain("Your draft has these problems");
    expect(result.card.title).toBe("Urgent cases reach a doctor sooner");
  });

  it("does not loop when the rewrite is no better: two calls at most, and the less weak draft is kept", async () => {
    const { call, requests } = scripted(() => weak);
    const result = await generateCard(args, call);
    expect(requests).toHaveLength(2);
    expect(result.card.title).toBe("Faster triage");
  });

  it("skips the quality rewrite in demo mode, as before", async () => {
    vi.stubEnv("DEMO_AI", "1");
    const { call, requests } = scripted(() => weak);
    await generateCard(args, call);
    expect(requests).toHaveLength(1);
  });
});

describe("factual safeguards are still applied", () => {
  const research = {
    sources: [{ title: "Imaging report", url: "https://example.org/imaging", kind: "web" as const }],
    webTexts: [{ title: "example.org", text: "Hospitals that flag urgent scans first reported shorter waits for patients. The pilot ran in three departments and urgent cases were reviewed by a specialist before routine ones. " + "Background about radiology workflows and queues. ".repeat(10) }],
  };
  const outline: CardBrief[] = [{ title: "Cover", points: [] }, { title: "Shorter waits", points: [], keyMessage: "Flagging urgent scans first shortens waits", evidence: true, layout: "bullets" }, { title: "End", points: [] }];
  const base = { layout: "bullets", eyebrow: "", icon: "", subtitle: "", stats: [], quote: "", quoteAuthor: "", table: { columns: [], rows: [] }, imageQuery: "" };
  const item = (text: string) => ({ heading: "Finding", text });
  const supported = { ...base, title: "Flagging urgent scans shortens waits", items: [item("Hospitals that flag urgent scans first reported shorter waits for their patients."), item("The pilot ran in three departments, with a specialist reviewing urgent cases first."), item("Routine scans were reviewed afterwards in the usual order by the same team.")] };
  const invented = { ...supported, items: [item("Waits fell by 63 percent across 4812 hospitals."), supported.items[1], supported.items[2]] };
  const misattributed = { ...supported, items: [item("According to Gartner, flagging urgent scans first shortens waits for patients."), supported.items[1], supported.items[2]] };
  const args = { deckTitle: "d", prompt: "AI in healthcare", outline, index: 1, mode: "standard" as const, research };

  const run = (first: unknown, second: unknown) =>
    scripted((request, n) => (request.role === "check" ? { problems: [] } : n === 1 ? first : second));

  it("makes the usual calls for a supported card: write, then one check", async () => {
    const { call, requests } = run(supported, supported);
    await generateCard(args, call);
    expect(requests.map((r) => r.role)).toEqual(["card", "check"]);
  });

  it("rewrites once, then removes anything still unsupported: invented numbers", async () => {
    const { call, requests } = run(invented, invented);
    const result = await generateCard(args, call);
    expect(requests.map((r) => r.role)).toEqual(["card", "check", "card"]);
    expect(requests[2].user).toContain("Never add a fact, figure, source or quote that isn't in the SOURCES");
    expect(JSON.stringify(result.card)).not.toContain("4812");
    expect(result.card.items.length).toBeGreaterThanOrEqual(2); // the card stays coherent
  });

  it("catches a made-up credit the same way", async () => {
    const { call, requests } = run(misattributed, supported);
    const result = await generateCard(args, call);
    expect(requests.map((r) => r.role)).toEqual(["card", "check", "card"]);
    expect(requests[2].user).toContain("Gartner");
    expect(JSON.stringify(result.card)).not.toContain("Gartner");
  });

  it("states the caution rules for sourced and unsourced decks", async () => {
    const { call, requests } = run(supported, supported);
    await generateCard(args, call);
    expect(requests[0].instructions).toContain("Keep the sources' own caution");
    expect(requests[0].instructions).toContain("Never invent a study, report, paper, web address or citation");
  });
});

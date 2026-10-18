import { describe, expect, it } from "vitest";

import { normalizeCard, type CardBrief, type CardContent } from "../cards";
import { attributionProblems, verifyCard } from "../factcheck";
import { describeQuality, issueScore, needsRepair, qualityIssues } from "../quality";

const card = (over: Partial<CardContent> = {}): CardContent => ({
  layout: "bullets",
  eyebrow: "",
  icon: "",
  title: "Urgent cases reach a doctor sooner",
  subtitle: "",
  items: [],
  stats: [],
  quote: "",
  quoteAuthor: "",
  table: { columns: [], rows: [] },
  image: null,
  ...over,
});

const items = (...texts: string[]) => texts.map((text, i) => ({ heading: `Point ${"abcdef"[i]}`, text }));

const brief = (over: Partial<CardBrief> = {}): CardBrief => ({
  title: "Faster triage",
  points: [],
  keyMessage: "Urgent scans are flagged so a specialist reviews them first",
  evidence: false,
  ...over,
});

const ctx = (over: Partial<Parameters<typeof qualityIssues>[1]> = {}) => ({
  index: 2,
  total: 6,
  brief: brief(),
  outline: [brief({ title: "Cover" }), brief({ title: "The problem", keyMessage: "Radiologists are overloaded with scans" }), brief(), brief({ title: "Limits", keyMessage: "Models can be wrong on rare conditions" })],
  density: "standard" as const,
  ...over,
});

const good = items(
  "Urgent scans are flagged by the model, so a specialist reviews them before the routine ones in the queue.",
  "Routine scans are reviewed in order, with the model's notes attached for the radiologist.",
  "A human always makes the final call on every flagged result before a patient is told.",
);

describe("weak-slide detection", () => {
  it("passes a solid conceptual slide that has no numbers at all", () => {
    const issues = qualityIssues(card({ items: good }), ctx());
    expect(issues).toEqual({ hard: [], soft: [] });
    expect(needsRepair(issues)).toBe(false);
  });

  it("never judges the cover, which may say very little", () => {
    expect(needsRepair(qualityIssues(card({ layout: "title", title: "AI in healthcare" }), ctx({ index: 0 })))).toBe(false);
  });

  it("always flags a card that is just a title and a line", () => {
    const issues = qualityIssues(card({ layout: "section", subtitle: "Things to know" }), ctx());
    expect(issues.hard).toHaveLength(1);
    expect(needsRepair(issues)).toBe(true);
  });

  it("lets a long deck have a chapter divider, and a closing card sum up in a sentence or two", () => {
    expect(needsRepair(qualityIssues(card({ layout: "section", subtitle: "Part two" }), ctx({ total: 12 })))).toBe(false);
    const summary = "Start with one clinic, measure what changes for patients, and let clinicians decide whether the tool earns its place before you expand it further.";
    expect(needsRepair(qualityIssues(card({ layout: "section", title: "Start small, then decide", subtitle: summary }), ctx({ index: 5, total: 6 })))).toBe(false);
  });

  it("accepts a quote card, a stats card and a table card as real content", () => {
    expect(needsRepair(qualityIssues(card({ layout: "quote", quote: "A real quote from the source text." }), ctx()))).toBe(false);
    expect(needsRepair(qualityIssues(card({ layout: "stats", stats: [{ value: "72%", label: "of scans flagged correctly" }] }), ctx()))).toBe(false);
    expect(needsRepair(qualityIssues(card({ layout: "table", table: { columns: ["A", "B"], rows: [["1", "2"], ["3", "4"]] } }), ctx()))).toBe(false);
  });

  it("flags generic filler, but one weak sign alone is not enough to rewrite", () => {
    const filler = items("AI plays a crucial role in modern healthcare delivery today.", "It has many benefits for patients and doctors alike in practice.", "Technology is very important in today's world for everyone.");
    const issues = qualityIssues(card({ items: filler }), ctx());
    expect(issues.soft.some((s) => /filler/.test(s))).toBe(true);
    expect(needsRepair({ hard: [], soft: [issues.soft[0]] })).toBe(false);
  });

  it("flags items too thin for the planned depth, scaled to the depth", () => {
    const thin = items("Faster care.", "Fewer errors.", "Lower cost.");
    expect(qualityIssues(card({ items: thin }), ctx({ density: "rich" })).soft.some((s) => /thin/.test(s))).toBe(true);
    expect(qualityIssues(card({ items: thin }), ctx({ density: "light" })).soft.some((s) => /thin/.test(s))).toBe(false);
  });

  it("asks for a rewrite when several weaker signs add up", () => {
    const weak = items("AI plays a crucial role.", "It is very important today.", "Many benefits exist.");
    const issues = qualityIssues(card({ title: "Faster triage", items: weak }), ctx({ density: "standard" }));
    expect(issues.soft.length).toBeGreaterThanOrEqual(2);
    expect(needsRepair(issues)).toBe(true);
    expect(describeQuality(issues)).toContain("- ");
  });

  it("flags a headline that only names the topic, and a card that ignores its key message", () => {
    const labelled = qualityIssues(card({ title: "Faster triage", items: good }), ctx());
    expect(labelled.soft.some((s) => /headline/.test(s))).toBe(true);
    const offPlan = qualityIssues(card({ title: "A holiday in Spain", items: items("Beaches are warm in summer, with plenty of sun for visitors.", "Cities have museums and tapas bars open late in the evening.", "Trains link the main cities quickly and cheaply for travellers.") }), ctx());
    expect(offPlan.soft.some((s) => /key message/.test(s))).toBe(true);
  });

  it("flags a card that repeats another card's point", () => {
    const outline = ctx().outline;
    const repeat = qualityIssues(card({ title: "Radiologists are overloaded with scans", subtitle: "Radiologists are overloaded with scans", items: good }), ctx({ outline }));
    expect(repeat.soft.some((s) => /repeats/.test(s))).toBe(true);
  });

  it("only asks for names, dates or figures on a card that is meant to state facts", () => {
    const vague = items("Hospitals use these tools for various reasons in their daily work routines.", "Doctors find them useful when the queue gets long and busy during the week.", "Patients benefit when their results come back more quickly than before.");
    expect(qualityIssues(card({ items: vague }), ctx({ brief: brief({ evidence: false }) })).soft.some((s) => /facts/.test(s))).toBe(false);
    expect(qualityIssues(card({ items: vague }), ctx({ brief: brief({ evidence: true }) })).soft.some((s) => /facts/.test(s))).toBe(true);
    const specific = items("The NHS trialled the tool in 2023 across twelve trusts and reported shorter waits.", "Radiologists at Guy's Hospital reviewed flagged scans first during the pilot study.", "Results were reviewed by an independent committee before any wider rollout began.");
    expect(qualityIssues(card({ items: specific }), ctx({ brief: brief({ evidence: true }) })).soft.some((s) => /facts/.test(s))).toBe(false);
  });

  it("scores a better card lower than a worse one", () => {
    const worse = qualityIssues(card({ layout: "section" }), ctx());
    const better = qualityIssues(card({ items: good }), ctx());
    expect(issueScore(better)).toBeLessThan(issueScore(worse));
  });

  it("works for decks from before the plan existed (no brief details)", () => {
    expect(needsRepair(qualityIssues(card({ items: good }), ctx({ brief: { title: "Old", points: [] } })))).toBe(false);
    expect(qualityIssues(card({ layout: "section" }), ctx({ brief: { title: "Old", points: [] } })).hard).toHaveLength(1);
  });

  it("agrees with the written card the way the pipeline normalizes it", () => {
    const written = normalizeCard({ layout: "bullets", icon: "", title: "T", subtitle: "", items: [{ heading: "a", text: "b" }], stats: [], quote: "", quoteAuthor: "" });
    expect(qualityIssues(written, ctx()).hard).toHaveLength(1);
  });
});

describe("credits and web addresses must come from the sources", () => {
  const texts = [
    { title: "who.int", text: "The World Health Organization reported in 2023 that screening reduced late diagnoses in several pilot programmes.", group: "who.int" },
    { title: "Medical imaging", text: "Medical imaging includes X-ray, CT and MRI techniques used to look inside the body.", group: "wikipedia" },
  ];
  const withText = (text: string) => card({ items: [{ heading: "Evidence", text }] });

  it("accepts a credit that names a source, or a party the sources themselves name", () => {
    expect(attributionProblems(withText("According to the World Health Organization, screening reduced late diagnoses."), texts, "")).toEqual([]);
    expect(attributionProblems(withText("According to Wikipedia, imaging includes X-ray, CT and MRI."), texts, "")).toEqual([]);
  });

  it("flags a credit to a study or organisation the sources don't mention", () => {
    const problems = attributionProblems(withText("According to Gartner, adoption doubled."), texts, "");
    expect(problems).toHaveLength(1);
    expect(problems[0].field).toBe("items.0");
    expect(attributionProblems(withText("A study by Stanford University found large gains."), texts, "")).toHaveLength(1);
  });

  it("flags a web address that isn't in the sources, but not a vague 'experts say'", () => {
    expect(attributionProblems(withText("Read more at https://made-up.example/report"), texts, "")).toHaveLength(1);
    expect(attributionProblems(withText("Experts say screening helps."), texts, "")).toEqual([]);
  });

  it("lets the user's own text be the source of a credit", () => {
    expect(attributionProblems(withText("According to Acme Clinics, waits fell."), texts, "Acme Clinics told us waits fell")).toEqual([]);
  });

  it("is part of verifyCard, so a made-up credit triggers the same rewrite as a made-up number", () => {
    const problems = verifyCard(withText("According to Gartner, adoption doubled."), texts, "");
    expect(problems.some((p) => /Gartner/.test(p.detail))).toBe(true);
  });

  it("leaves the number and quote checks as they were", () => {
    const problems = verifyCard(withText("The programme covered 4812 patients."), texts, "");
    expect(problems.some((p) => /4812/.test(p.detail))).toBe(true);
  });
});

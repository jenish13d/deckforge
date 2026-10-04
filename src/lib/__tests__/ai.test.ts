import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GenerationError,
  outlineChoice,
  buildParams,
  choiceForMode,
  deckContext,
  generateCard,
  generateOutline,
  type CallModel,
  type ModelRequest,
} from "../ai";
import { OutlineSchema } from "../cards";
import { callDemo } from "../demo-ai";

function fakeModel(output: unknown) {
  const requests: ModelRequest<unknown>[] = [];
  const call = (async (request: ModelRequest<unknown>) => {
    requests.push(request);
    return output;
  }) as CallModel;
  return { call, requests };
}

const outline = [
  { title: "Welcome", points: ["Who we are"] },
  { title: "The problem", points: ["Meal prep takes hours"] },
  { title: "Next steps", points: [] },
];

describe("generateOutline", () => {
  it("asks for the requested number of cards and normalizes the result", async () => {
    const { call, requests } = fakeModel({
      title: "Meal prep",
      cards: [...outline, { title: "Extra", points: [] }],
    });
    const result = await generateOutline("Pitch deck for meal prep", 3, call);
    expect(result.cards).toHaveLength(3);
    expect(requests[0].user).toContain("exactly 3 cards");
    expect(requests[0].user).toContain("Pitch deck for meal prep");
  });

  it("fails when no usable cards come back", async () => {
    const { call } = fakeModel({ title: "x", cards: [{ title: "", points: [] }] });
    await expect(generateOutline("x", 3, call)).rejects.toBeInstanceOf(GenerationError);
  });
});

describe("generateCard", () => {
  const card = {
    layout: "bullets",
    icon: "🥗",
    title: "The problem",
    subtitle: "",
    items: [{ heading: "Time", text: "Cooking takes hours." }],
    stats: [],
    quote: "",
    quoteAuthor: "",
  };

  it("sends the shared deck context separately from the per-card request", async () => {
    const { call, requests } = fakeModel(card);
    const result = await generateCard({ deckTitle: "Meal prep", prompt: "brief", outline, index: 1, mode: "standard" }, call);
    expect(result.title).toBe("The problem");
    expect(requests[0].context).toBe(deckContext("Meal prep", "brief", outline));
    expect(requests[0].user).toContain('card 2 of 3: "The problem"');
    expect(requests[0].user).not.toContain("first card");
  });

  it("asks for a title layout on the first card and passes extra instructions", async () => {
    const { call, requests } = fakeModel(card);
    await generateCard({ deckTitle: "Meal prep", prompt: "brief", outline, index: 0, mode: "standard", extra: "shorter" }, call);
    expect(requests[0].user).toContain('"title" layout');
    expect(requests[0].user).toContain("Also: shorter");
  });

  it("uses identical instructions for every card so they can be cached", async () => {
    const { call, requests } = fakeModel(card);
    await generateCard({ deckTitle: "d", prompt: "p", outline, index: 0, mode: "quick" }, call);
    await generateCard({ deckTitle: "d", prompt: "p", outline, index: 2, mode: "quick" }, call);
    expect(requests[0].instructions).toBe(requests[1].instructions);
    expect(requests[0].context).toBe(requests[1].context);
  });
});

describe("modes", () => {
  it("runs each card on the model of its mode", async () => {
    const { call, requests } = fakeModel({
      layout: "bullets", icon: "", title: "t", subtitle: "", items: [], stats: [], quote: "", quoteAuthor: "",
    });
    for (const mode of ["quick", "standard", "premium"] as const) {
      await generateCard({ deckTitle: "d", prompt: "p", outline, index: 1, mode }, call);
    }
    expect(requests.map((r) => r.model)).toEqual(["claude-haiku-4-5", "claude-sonnet-5-5", "claude-opus-5-5"]);
  });

  it("sends no effort or fallback to Haiku, and both to Sonnet/Opus", () => {
    const base = { instructions: "i", user: "u", schema: OutlineSchema };
    const quick = buildParams({ ...base, ...choiceForMode("quick") });
    expect(quick.output_config).not.toHaveProperty("effort");
    expect(quick).not.toHaveProperty("fallbacks");

    const premium = buildParams({ ...base, ...choiceForMode("premium") });
    expect(premium.output_config).toMatchObject({ effort: "high" });
    expect(premium).toMatchObject({ fallbacks: "default", betas: ["server-side-fallback-2026-07-01"] });

    const outlineParams = buildParams({ ...base, ...outlineChoice() });
    expect(outlineParams.model).toBe("claude-sonnet-5-5");
    expect(outlineParams.output_config).toMatchObject({ effort: "low" });
  });

  it("puts the cache breakpoint on the last system block", () => {
    const params = buildParams({ instructions: "i", context: "c", user: "u", schema: OutlineSchema, ...choiceForMode("standard") });
    expect(params.system[0]).not.toHaveProperty("cache_control");
    expect(params.system[1]).toMatchObject({ text: "c", cache_control: { type: "ephemeral" } });
  });
});

describe("demo mode", () => {
  it("produces a valid outline and cards through the normal pipeline", async () => {
    const result = await generateOutline("Pitch deck for a bakery", 5, callDemo);
    expect(result.cards).toHaveLength(5);
    expect(result.title).toBe("Pitch deck for a bakery");

    const first = await generateCard({ deckTitle: result.title, prompt: "p", outline: result.cards, index: 0, mode: "quick" }, callDemo);
    const middle = await generateCard({ deckTitle: result.title, prompt: "p", outline: result.cards, index: 2, mode: "quick" }, callDemo);
    expect(first.layout).toBe("title");
    expect(first.title).toBe(result.cards[0].title);
    expect(middle.title).toBe(result.cards[2].title);
  });
});

describe("providers", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses Gemini for Quick/Standard when only a Gemini key is set, and Claude for Premium", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "g-key");
    vi.stubEnv("AI_PROVIDER", "");
    expect(choiceForMode("quick")).toEqual({ provider: "gemini", model: "gemini-flash-lite-latest", effort: null });
    expect(choiceForMode("standard")).toEqual({ provider: "gemini", model: "gemini-flash-lite-latest", effort: "medium" });
    expect(choiceForMode("premium")).toMatchObject({ provider: "anthropic", model: "claude-opus-5-5" });
    expect(outlineChoice()).toMatchObject({ provider: "gemini", effort: "low" });
  });

  it("prefers Claude when its key is set, unless AI_PROVIDER says otherwise", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "a-key");
    vi.stubEnv("GEMINI_API_KEY", "g-key");
    vi.stubEnv("AI_PROVIDER", "");
    expect(choiceForMode("standard")).toMatchObject({ provider: "anthropic", model: "claude-sonnet-5-5" });
    vi.stubEnv("AI_PROVIDER", "gemini");
    expect(choiceForMode("standard")).toMatchObject({ provider: "gemini" });
  });

  it("lets GEMINI_*_MODEL override the default models", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "g-key");
    vi.stubEnv("GEMINI_STANDARD_MODEL", "gemini-custom");
    expect(choiceForMode("standard").model).toBe("gemini-custom");
  });
});

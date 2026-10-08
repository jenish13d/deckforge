import { afterEach, describe, expect, it, vi } from "vitest";

import { extractJson, fillMissing } from "../openai-compat";
import { relevantExcerpt, mergeResearch } from "../research";
import { freeLlmApiBase, isRestrictedRegion, providerOrder } from "../router";

describe("AI team routing", () => {
  afterEach(() => vi.unstubAllEnvs());

  const keys = (...names: string[]) => {
    for (const k of ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY", "ZAI_API_KEY", "AI_PROVIDER", "GEMINI_PAID"]) vi.stubEnv(k, "");
    for (const n of names) vi.stubEnv(n, "k");
  };

  it("uses the best provider for each job, skipping ones without keys", () => {
    keys("GEMINI_API_KEY", "GROQ_API_KEY", "ZAI_API_KEY");
    expect(providerOrder({ role: "card" })).toEqual(["groq", "gemini", "zai"]);
    expect(providerOrder({ role: "outline" })).toEqual(["gemini", "groq", "zai"]);
  });

  it("keeps UK/EU users off Gemini's free tier and China-hosted models", () => {
    keys("GEMINI_API_KEY", "GROQ_API_KEY", "ZAI_API_KEY");
    expect(isRestrictedRegion("gb")).toBe(true);
    expect(isRestrictedRegion("US")).toBe(false);
    expect(providerOrder({ role: "card", region: "DE" })).toEqual(["groq"]);
    vi.stubEnv("GEMINI_PAID", "1");
    expect(providerOrder({ role: "card", region: "DE" })).toEqual(["groq", "gemini"]);
  });

  it("puts paid models first, and uses only them for Premium", () => {
    keys("GEMINI_API_KEY", "OPENAI_API_KEY");
    expect(providerOrder({ role: "card" })).toEqual(["openai", "gemini"]);
    expect(providerOrder({ role: "card", mode: "premium" })).toEqual(["openai"]);
    keys("GEMINI_API_KEY");
    expect(providerOrder({ role: "card", mode: "premium" })).toEqual([]);
  });
});

describe("FreeLLMAPI (development only)", () => {
  afterEach(() => vi.unstubAllEnvs());
  const setup = (base = "http://localhost:3001/v1") => {
    for (const k of ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY", "ZAI_API_KEY", "AI_PROVIDER", "GEMINI_PAID", "VERCEL", "FREELLMAPI_ALLOW_PRODUCTION"]) vi.stubEnv(k, "");
    vi.stubEnv("GROQ_API_KEY", "k");
    vi.stubEnv("FREELLMAPI_BASE_URL", base);
    vi.stubEnv("FREELLMAPI_KEY", "freellmapi-test");
  };

  it("is off unless both its address and key are set, and then comes last", () => {
    setup();
    expect(providerOrder({ role: "card" })).toEqual(["groq", "freellmapi"]);
    vi.stubEnv("FREELLMAPI_KEY", "");
    expect(providerOrder({ role: "card" })).toEqual(["groq"]);
    expect(freeLlmApiBase()).toBeNull();
  });

  it("stays out of production on Vercel unless that is switched on", () => {
    setup();
    vi.stubEnv("VERCEL", "1");
    expect(providerOrder({ role: "card" })).toEqual(["groq"]);
    vi.stubEnv("FREELLMAPI_ALLOW_PRODUCTION", "1");
    expect(providerOrder({ role: "card" })).toEqual(["groq", "freellmapi"]);
  });

  it("is never used for UK/EU visitors, Premium or photo reading", () => {
    setup();
    expect(providerOrder({ role: "card", region: "DE" })).toEqual(["groq"]);
    expect(providerOrder({ role: "vision" })).toEqual(["groq"]);
    expect(providerOrder({ role: "card", mode: "premium" })).toEqual([]);
  });

  it("only talks plain http to this machine", () => {
    setup("http://freellm.example.com/v1");
    expect(freeLlmApiBase()).toBeNull();
    setup("https://freellm.example.com/v1/");
    expect(freeLlmApiBase()).toBe("https://freellm.example.com/v1");
    setup("not a url");
    expect(freeLlmApiBase()).toBeNull();
  });
});

describe("answers from open models", () => {
  it("finds the JSON in a chatty answer and fills fields left out", () => {
    expect(extractJson('Sure! ```json\n{"a": 1}\n```')).toEqual({ a: 1 });
    const schema = { type: "object", properties: { title: { type: "string" }, items: { type: "array" }, ok: { type: "boolean" } } };
    expect(fillMissing({ title: "x" }, schema)).toEqual({ title: "x", items: [], ok: false });
  });
});

describe("research", () => {
  it("picks the paragraphs that match the card", () => {
    const texts = [{ title: "A", text: "Intro paragraph about the player and his long career in football.\nHe joined Juventus in 2018 and scored 101 goals for the Italian club.\nHis hobbies include films and music with friends and family." }];
    const excerpt = relevantExcerpt(texts, "Juventus goals", 400);
    expect(excerpt).toContain("Juventus in 2018");
    expect(excerpt).not.toContain("hobbies");
  });

  it("keeps one page per website", () => {
    const page = (url: string) => ({ sources: [{ title: url, url, kind: "web" as const }], webTexts: [{ title: new URL(url).hostname.replace(/^www\./, ""), text: "x" }] });
    const merged = mergeResearch(page("https://www.espn.com/a"), page("https://espn.com/b"), page("https://bbc.com/c"));
    expect(merged.sources.map((s) => s.url)).toEqual(["https://www.espn.com/a", "https://bbc.com/c"]);
  });
});

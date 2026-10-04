import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OutlineSchema } from "../cards";
import { GenerationError } from "../errors";
import { GeminiBusyError, callGemini } from "../gemini";

const outline = { title: "Bakery pitch", cards: [{ title: "Why now", points: ["Demand is up"] }] };
const ok = (body: unknown) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(body) }], role: "model" } }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
const busy = (details: unknown[] = []) =>
  new Response(
    JSON.stringify({ error: { code: 429, message: "Resource exhausted", status: "RESOURCE_EXHAUSTED", details } }),
    { status: 429, headers: { "content-type": "application/json" } },
  );
const retryIn = (seconds: string) => ({ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: seconds });
const quota = (id: string) => ({
  "@type": "type.googleapis.com/google.rpc.QuotaFailure",
  violations: [{ quotaId: id }],
});

const request = {
  provider: "gemini" as const,
  model: "gemini-flash-lite-latest",
  effort: null,
  instructions: "You plan presentations.",
  context: "Deck title: Bakery",
  user: "Create an outline",
  schema: OutlineSchema,
};

describe("callGemini (simulated Google API)", () => {
  beforeEach(() => vi.stubEnv("GEMINI_API_KEY", "test-key"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("sends a structured-output request and parses the answer", async () => {
    const fetchMock = vi.fn(async () => ok(outline));
    vi.stubGlobal("fetch", fetchMock);

    await expect(callGemini(request)).resolves.toEqual(outline);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toContain("gemini-flash-lite-latest:generateContent");
    const body = JSON.parse(String(init.body));
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseJsonSchema.type).toBe("object");
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
    expect(JSON.stringify(body.systemInstruction)).toContain("Deck title: Bakery");
  });

  it("retries when Google is busy, then succeeds", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValueOnce(busy([retryIn("3s")])).mockResolvedValueOnce(ok(outline));
    vi.stubGlobal("fetch", fetchMock);

    const result = callGemini(request);
    await vi.advanceTimersByTimeAsync(3000);
    await expect(result).resolves.toEqual(outline);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("hands long waits back to the browser with the suggested delay", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => busy([retryIn("42s")])));
    const error = await callGemini(request).catch((e) => e);
    expect(error).toBeInstanceOf(GeminiBusyError);
    expect(error).toBeInstanceOf(GenerationError);
    expect(error.retryAfterSeconds).toBe(42);
    expect(error.daily).toBe(false);
  });

  it("stops at once when the daily quota is used up", async () => {
    const fetchMock = vi.fn(async () => busy([quota("GenerateRequestsPerDayPerProjectPerModel-FreeTier"), retryIn("5s")]));
    vi.stubGlobal("fetch", fetchMock);
    const error = await callGemini(request).catch((e) => e);
    expect(error).toBeInstanceOf(GeminiBusyError);
    expect(error.daily).toBe(true);
    expect(error.message).toMatch(/tomorrow/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps waiting short delays itself, up to its limit", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => busy([retryIn("8s")]));
    vi.stubGlobal("fetch", fetchMock);
    const result = callGemini(request).catch((e) => e);
    await vi.advanceTimersByTimeAsync(30000);
    const error = await result;
    expect(error).toBeInstanceOf(GeminiBusyError);
    expect(fetchMock).toHaveBeenCalledTimes(3); // waits 8s twice (16s ≤ 20s), then hands back
  });

  it("rejects answers that don't match the expected shape", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ok({ wrong: true })));
    await expect(callGemini(request)).rejects.toThrow(/expected format/);
  });
});

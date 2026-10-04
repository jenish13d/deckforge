import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OutlineSchema } from "../cards";
import { GenerationError } from "../errors";
import { callGemini } from "../gemini";

const outline = { title: "Bakery pitch", cards: [{ title: "Why now", points: ["Demand is up"] }] };
const ok = (body: unknown) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(body) }], role: "model" } }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
const busy = () =>
  new Response(JSON.stringify({ error: { code: 429, message: "Resource exhausted", status: "RESOURCE_EXHAUSTED" } }), {
    status: 429,
    headers: { "content-type": "application/json" },
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
    const fetchMock = vi.fn().mockResolvedValueOnce(busy()).mockResolvedValueOnce(ok(outline));
    vi.stubGlobal("fetch", fetchMock);

    const result = callGemini(request);
    await vi.advanceTimersByTimeAsync(5000);
    await expect(result).resolves.toEqual(outline);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives a friendly error when Google stays busy", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(async () => busy()));

    const result = callGemini(request).catch((e) => e);
    await vi.advanceTimersByTimeAsync(20000);
    const error = await result;
    expect(error).toBeInstanceOf(GenerationError);
    expect(error.message).toMatch(/busy/);
  });

  it("rejects answers that don't match the expected shape", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ok({ wrong: true })));
    await expect(callGemini(request)).rejects.toThrow(/expected format/);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { GeneratedCardSchema } from "../cards";
import { toGeminiSchema } from "../gemini";
import { availableModes, premiumAvailable } from "../providers";

describe("premium availability", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("hides Premium without a Claude key, even on Pro", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("DEMO_AI", "");
    expect(premiumAvailable()).toBe(false);
    expect(availableModes("pro")).toEqual(["quick", "standard"]);
  });

  it("offers Premium on Pro with a Claude key or in demo mode", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "a-key");
    expect(availableModes("pro")).toEqual(["quick", "standard", "premium"]);
    expect(availableModes("free")).toEqual(["quick", "standard"]);
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("DEMO_AI", "1");
    expect(premiumAvailable()).toBe(true);
  });
});

describe("toGeminiSchema", () => {
  it("keeps the structure but drops $schema and additionalProperties", () => {
    const schema = toGeminiSchema(GeneratedCardSchema) as Record<string, unknown>;
    const json = JSON.stringify(schema);
    expect(json).not.toContain("$schema");
    expect(json).not.toContain("additionalProperties");
    expect(schema.type).toBe("object");
    expect(Object.keys(schema.properties as object)).toContain("items");
  });
});

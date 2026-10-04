import { describe, expect, it } from "vitest";

import { hashPassword, validateCredentials, verifyPassword } from "../password";
import { canUseMode, cardCost } from "../plans";
import { createRateLimiter } from "../rate-limit";

describe("passwords", () => {
  it("verifies the right password only", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
    expect(await verifyPassword("correct horse batterY", stored)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });

  it("salts each hash", async () => {
    expect(await hashPassword("same password")).not.toBe(await hashPassword("same password"));
  });

  it("validates sign-up input", () => {
    expect(validateCredentials("a@b.co", "longenough")).toBeNull();
    expect(validateCredentials("not-an-email", "longenough")).toMatch(/email/);
    expect(validateCredentials("a@b.co", "short")).toMatch(/8 characters/);
  });
});

describe("plans", () => {
  it("locks Premium to Pro", () => {
    expect(canUseMode("free", "standard")).toBe(true);
    expect(canUseMode("free", "premium")).toBe(false);
    expect(canUseMode("pro", "premium")).toBe(true);
    expect(canUseMode("something-else", "premium")).toBe(false);
  });

  it("prices cards by mode", () => {
    expect([cardCost("quick"), cardCost("standard"), cardCost("premium")]).toEqual([1, 2, 4]);
    expect(cardCost("standard", 8)).toBe(16);
  });
});

describe("createRateLimiter", () => {
  it("allows up to the limit per key and resets after the window", () => {
    let now = 0;
    const allow = createRateLimiter(2, 1000, () => now);
    expect([allow("a"), allow("a"), allow("a")]).toEqual([true, true, false]);
    expect(allow("b")).toBe(true);
    now = 1000;
    expect(allow("a")).toBe(true);
  });
});

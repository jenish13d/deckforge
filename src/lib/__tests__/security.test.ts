import { describe, expect, it } from "vitest";

import { hashToken, newEditToken, tokenMatches } from "../edit-token";
import { createRateLimiter } from "../rate-limit";

describe("edit tokens", () => {
  it("matches only the original token", () => {
    const { token, hash } = newEditToken();
    expect(hash).toBe(hashToken(token));
    expect(tokenMatches(token, hash)).toBe(true);
    expect(tokenMatches(`${token}x`, hash)).toBe(false);
    expect(tokenMatches(null, hash)).toBe(false);
  });

  it("generates different tokens", () => {
    expect(newEditToken().token).not.toBe(newEditToken().token);
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

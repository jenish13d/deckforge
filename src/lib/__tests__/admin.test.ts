import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdminEmail } from "../admin";

describe("isAdminEmail", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reads ADMIN_EMAILS and the singular ADMIN_EMAIL", () => {
    vi.stubEnv("ADMIN_EMAILS", "a@example.com, b@example.com");
    vi.stubEnv("ADMIN_EMAIL", " Owner@Example.com ");
    expect(isAdminEmail("b@example.com")).toBe(true);
    expect(isAdminEmail("owner@example.com")).toBe(true);
    expect(isAdminEmail("someone@example.com")).toBe(false);
  });
});

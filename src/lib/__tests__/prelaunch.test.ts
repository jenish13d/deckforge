import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { proxy } from "../../proxy";
import { cardCost } from "../plans";
import { accountAllowed, inviteAccountExpiry, inviteExpiry, lockedFor, makeCode, normalizeCode, openBeforeLaunch } from "../prelaunch";

describe("invite codes", () => {
  it("are XXXX-XXXX from letters and digits that can't be confused", () => {
    const code = makeCode(new Uint8Array([0, 1, 2, 3, 250, 251, 252, 253]));
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(code).not.toMatch(/[01OIL]/);
    for (let i = 0; i < 50; i++) {
      const random = makeCode(crypto.getRandomValues(new Uint8Array(8)));
      expect(random).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{4}$/);
    }
  });

  it("accept what people type: lower case, spaces, a missing dash", () => {
    expect(normalizeCode("abcd-efgh")).toBe("ABCD-EFGH");
    expect(normalizeCode(" abcd efgh ")).toBe("ABCD-EFGH");
    expect(normalizeCode("ABCDEFGH")).toBe("ABCD-EFGH");
    expect(normalizeCode("ABCD-EFG")).toBe("");
    expect(normalizeCode(12345678)).toBe("");
    expect(normalizeCode(undefined)).toBe("");
  });

  it("work for 24 hours and make 24-hour accounts", () => {
    const now = new Date("2026-10-18T10:00:00Z");
    expect(inviteExpiry(now).toISOString()).toBe("2026-10-19T10:00:00.000Z");
    expect(inviteAccountExpiry(now).toISOString()).toBe("2026-10-19T10:00:00.000Z");
  });
});

describe("who can sign in", () => {
  const now = new Date("2026-10-18T10:00:00Z");
  const later = new Date("2026-10-18T11:00:00Z");
  const earlier = new Date("2026-10-18T09:00:00Z");

  it("before launch: admins and live invite accounts only", () => {
    expect(accountAllowed({ expiresAt: null }, { admin: true, prelaunch: true, now })).toBe(true);
    expect(accountAllowed({ expiresAt: null }, { admin: false, prelaunch: true, now })).toBe(false);
    expect(accountAllowed({ expiresAt: later }, { admin: false, prelaunch: true, now })).toBe(true);
    expect(accountAllowed({ expiresAt: earlier }, { admin: false, prelaunch: true, now })).toBe(false);
    expect(accountAllowed({ expiresAt: now }, { admin: false, prelaunch: true, now })).toBe(false);
  });

  it("after launch: everyone, but invite accounts still end", () => {
    expect(accountAllowed({ expiresAt: null }, { admin: false, prelaunch: false, now })).toBe(true);
    expect(accountAllowed({ expiresAt: earlier }, { admin: false, prelaunch: false, now })).toBe(false);
  });
});

describe("pages before launch", () => {
  it("keeps sign-in, legal pages, shared decks and APIs open", () => {
    for (const path of ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/privacy", "/terms", "/admin", "/launch/leave", "/d/abc", "/d/abc/present", "/api/launch-list", "/ingest/e/", "/robots.txt"]) {
      expect(openBeforeLaunch(path), path).toBe(true);
    }
  });

  it("closes the marketing and app pages", () => {
    for (const path of ["/pricing", "/features", "/templates", "/ai-ppt-maker", "/about", "/decks", "/account", "/dashboard"]) {
      expect(openBeforeLaunch(path), path).toBe(false);
    }
  });
});

describe("the pre-launch redirect", () => {
  afterEach(() => vi.unstubAllEnvs());
  const visit = (path: string, cookie?: string) => proxy(new NextRequest(`https://slidezza.test${path}`, { headers: cookie ? { cookie } : {} }));

  it("sends visitors without an account to the home page", () => {
    vi.stubEnv("PRELAUNCH", "1");
    const response = visit("/pricing");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://slidezza.test/");
    expect(visit("/signup?code=ABCD-EFGH").headers.get("location")).toBeNull();
  });

  it("lets signed-in visitors through (pages check the account), and does nothing after launch", () => {
    vi.stubEnv("PRELAUNCH", "1");
    expect(visit("/pricing", "df_session=abc").headers.get("location")).toBeNull();
    vi.stubEnv("PRELAUNCH", "");
    expect(visit("/pricing").headers.get("location")).toBeNull();
  });
});

describe("admin credits", () => {
  it("make the free models cost nothing for admins, and nothing else changes", () => {
    expect(cardCost("quick", 10, { admin: true })).toBe(0);
    expect(cardCost("standard", 10, { admin: true })).toBe(0);
    expect(cardCost("premium", 2, { admin: true })).toBe(cardCost("premium", 2));
    expect(cardCost("standard", 3)).toBeGreaterThan(0);
  });
});

describe("locking some countries only", () => {
  afterEach(() => vi.unstubAllEnvs());
  const visit = (path: string, country: string | null) =>
    proxy(new NextRequest(`https://slidezza.test${path}`, { headers: country ? { "x-vercel-ip-country": country } : {} }));

  it("locks visitors from the listed countries and opens the site to everyone else", () => {
    vi.stubEnv("PRELAUNCH", "");
    vi.stubEnv("PRELAUNCH_COUNTRIES", "IN, pk");
    expect(lockedFor("IN")).toBe(true);
    expect(lockedFor("pk")).toBe(true);
    expect(lockedFor("US")).toBe(false);
    expect(lockedFor(null)).toBe(false);
    expect(visit("/pricing", "IN").headers.get("location")).toBe("https://slidezza.test/");
    expect(visit("/pricing", "US").headers.get("location")).toBeNull();
    expect(visit("/pricing", null).headers.get("location")).toBeNull();
  });

  it("locks everyone, unknown countries included, when the whole site is locked", () => {
    vi.stubEnv("PRELAUNCH", "1");
    vi.stubEnv("PRELAUNCH_COUNTRIES", "IN");
    expect(lockedFor("US")).toBe(true);
    expect(lockedFor(null)).toBe(true);
  });
});

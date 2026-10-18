import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const sent = vi.hoisted(() => ({ events: [] as unknown[], errors: [] as unknown[][], fail: false, created: 0 }));
vi.mock("posthog-node", () => ({
  PostHog: class {
    constructor() {
      sent.created++;
    }
    async captureImmediate(message: unknown) {
      if (sent.fail) throw new Error("network down");
      sent.events.push(message);
    }
    async captureExceptionImmediate(...args: unknown[]) {
      sent.errors.push(args);
    }
  },
}));

import { askFirst, captureServerError, consentFrom, resetAnalyticsForTests, trackServer } from "../analytics";
import { analyticsConsent, readCookie } from "../consent";

const request = (country: string | null, cookie?: string) =>
  new Request("https://example.com/api/auth/signup", {
    method: "POST",
    headers: { ...(country ? { "x-vercel-ip-country": country } : {}), ...(cookie ? { cookie } : {}) },
  });

describe("analytics consent", () => {
  it("follows the visitor's saved choice first", () => {
    expect(analyticsConsent("1", true)).toBe("granted");
    expect(analyticsConsent("0", false)).toBe("denied");
  });

  it("asks first only where required, and is on elsewhere until turned off", () => {
    expect(analyticsConsent(undefined, true)).toBe("ask");
    expect(analyticsConsent(undefined, false)).toBe("granted");
    expect(analyticsConsent("maybe", true)).toBe("ask");
  });

  it("asks first in the EU, EEA, UK and Switzerland, and when the country is unknown", () => {
    for (const country of ["DE", "fr", "GB", "CH", "NO"]) expect(askFirst(country)).toBe(true);
    expect(askFirst(null)).toBe(true);
    expect(askFirst("")).toBe(true);
    for (const country of ["US", "IN", "BR"]) expect(askFirst(country)).toBe(false);
  });

  it("reads one cookie from a Cookie header", () => {
    expect(readCookie("a=1; sz_analytics=0; b=2", "sz_analytics")).toBe("0");
    expect(readCookie("xsz_analytics=1", "sz_analytics")).toBeUndefined();
    expect(readCookie(null, "sz_analytics")).toBeUndefined();
  });

  it("combines cookie and country from request headers", () => {
    expect(consentFrom(request("US").headers)).toBe("granted");
    expect(consentFrom(request("DE").headers)).toBe("ask");
    expect(consentFrom(request("DE", "sz_analytics=1").headers)).toBe("granted");
    expect(consentFrom(request("US", "sz_analytics=0").headers)).toBe("denied");
  });
});

describe("server analytics", () => {
  beforeEach(() => {
    sent.events = [];
    sent.errors = [];
    sent.fail = false;
    sent.created = 0;
    resetAnalyticsForTests();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    resetAnalyticsForTests();
  });

  it("does nothing without a PostHog key", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    await trackServer(request("US"), "user_1", "signed_up");
    await captureServerError(new Error("boom"));
    expect(sent.created).toBe(0);
    expect(sent.events).toEqual([]);
    expect(sent.errors).toEqual([]);
  });

  it("sends funnel events with the account id only when the visitor allows analytics", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    await trackServer(request("US"), "user_1", "signed_up");
    await trackServer(request("DE"), "user_2", "signed_up");
    await trackServer(request("DE", "sz_analytics=1"), "user_3", "deck_created", { cards: 8 });
    await trackServer(request("US", "sz_analytics=0"), "user_4", "signed_up");
    expect(sent.events).toEqual([
      { distinctId: "user_1", event: "signed_up", properties: {} },
      { distinctId: "user_3", event: "deck_created", properties: { cards: 8 } },
    ]);
  });

  it("never lets a failed event break the request", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    sent.fail = true;
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(trackServer(request("US"), "user_1", "signed_up")).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("reports server errors without a user", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    const error = new Error("boom");
    await captureServerError(error, { path: "/api/decks" });
    expect(sent.errors).toEqual([[error, undefined, { path: "/api/decks" }]]);
  });
});

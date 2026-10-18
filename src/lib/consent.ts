// Product analytics (PostHog) runs only with the visitor's consent. Visitors from the EU, EEA, UK
// and Switzerland, or from an unknown country, are asked first; everyone else can turn it off on
// the Privacy page. The choice is kept in one first-party cookie so the server can respect it too.

export const CONSENT_COOKIE = "sz_analytics";

/** granted: analytics on; denied: off; ask: off until the visitor chooses. */
export type Consent = "granted" | "denied" | "ask";

export function analyticsConsent(cookie: string | undefined | null, askFirst: boolean): Consent {
  if (cookie === "1") return "granted";
  if (cookie === "0") return "denied";
  return askFirst ? "ask" : "granted";
}

/** The value of one cookie from a Cookie header (or `document.cookie`). */
export function readCookie(header: string | null | undefined, name: string): string | undefined {
  for (const part of (header ?? "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return undefined;
}

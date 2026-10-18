import "server-only";

import { PostHog } from "posthog-node";

import { CONSENT_COOKIE, analyticsConsent, readCookie, type Consent } from "./consent";
import { isRestrictedRegion } from "./router";

// Server-side product analytics (PostHog). Off unless NEXT_PUBLIC_POSTHOG_KEY is set. Funnel events
// are sent only with the visitor's consent and carry the account id, never the email. Server errors
// are sent without any user details. A failure here never affects the request.

const HOST = "https://us.i.posthog.com";

let client: PostHog | null | undefined;

function posthog(): PostHog | null {
  if (client === undefined) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    // Serverless functions stop after the response: send each event at once.
    client = key ? new PostHog(key, { host: HOST, flushAt: 1, flushInterval: 0, disableGeoip: true }) : null;
  }
  return client;
}

/** Asks first when the country is unknown or in the EU, EEA, UK or Switzerland. */
export const askFirst = (country: string | null | undefined) => !country || isRestrictedRegion(country);

/** The visitor's analytics choice, from their cookie and country (request headers). */
export function consentFrom(headers: { get(name: string): string | null }): Consent {
  return analyticsConsent(readCookie(headers.get("cookie"), CONSENT_COOKIE), askFirst(headers.get("x-vercel-ip-country")));
}

/** Records a funnel event for a signed-in account, if the visitor allows analytics. Run it with `after()`. */
export async function trackServer(request: Request, userId: string, event: string, properties: Record<string, string | number | boolean> = {}) {
  const ph = posthog();
  if (!ph || consentFrom(request.headers) !== "granted") return;
  try {
    await ph.captureImmediate({ distinctId: userId, event, properties });
  } catch (error) {
    console.error("Analytics event failed", error);
  }
}

/** Reports a server error to error tracking, with only technical details (no user, no query string). */
export async function captureServerError(error: unknown, properties: Record<string, string | undefined> = {}) {
  const ph = posthog();
  if (!ph) return;
  try {
    await ph.captureExceptionImmediate(error, undefined, properties);
  } catch (failure) {
    console.error("Error report failed", failure);
  }
}

/** For tests: forget the client so a changed key is read again. */
export function resetAnalyticsForTests() {
  client = undefined;
}

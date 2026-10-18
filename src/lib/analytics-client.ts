import type { PostHog } from "posthog-js";

import { CONSENT_COOKIE, type Consent } from "./consent";

// Product analytics in the browser (PostHog: page views, funnel events, errors and session replays).
// Nothing is loaded or sent without consent, or when NEXT_PUBLIC_POSTHOG_KEY isn't set. The library
// is loaded on demand, so pages don't get heavier for visitors who don't allow it. Events go through
// /ingest on this site (see next.config.ts). The account is identified by its id, never its email.

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

let instance: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
// Events from the first render can come before analytics starts (child effects run first): they wait here,
// and are sent if it starts or dropped if it doesn't.
let waiting: ((ph: PostHog) => void)[] = [];

function load(userId: string | null): Promise<PostHog | null> {
  if (!KEY || typeof window === "undefined") return Promise.resolve(null);
  loading ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(KEY, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        capture_pageview: "history_change",
        capture_pageleave: true,
        capture_exceptions: true,
        person_profiles: "identified_only",
        // A signed-in visitor is known from the first event.
        ...(userId ? { bootstrap: { distinctID: userId, isIdentifiedID: true } } : {}),
        // Replays never show what people type, their decks or anything in the signed-in app.
        session_recording: { maskAllInputs: true, maskTextSelector: ".app, .card, [data-private]" },
      });
      instance = posthog;
      return posthog;
    })
    .catch((error) => {
      console.error("Analytics didn't load", error);
      loading = null;
      return null;
    });
  return loading;
}

/** Starts analytics when allowed, and keeps the signed-in account in step (identify on sign-in, reset on sign-out). */
export async function startAnalytics(consent: Consent, userId: string | null) {
  if (consent !== "granted") {
    waiting = [];
    return;
  }
  const ph = await load(userId);
  if (!ph) return;
  for (const send of waiting.splice(0)) send(ph);
  if (userId) {
    if (ph.get_distinct_id() !== userId) ph.identify(userId);
  } else if (ph.get_property("$user_state") === "identified") {
    ph.reset();
  }
}

/** Saves the visitor's choice and turns analytics on or off at once. */
export async function chooseAnalytics(allow: boolean, userId: string | null) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${allow ? "1" : "0"}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`;
  if (allow) {
    const wasOff = instance;
    const ph = await load(userId);
    if (wasOff) ph?.opt_in_capturing();
    await startAnalytics("granted", userId);
    return;
  }
  waiting = [];
  instance?.opt_out_capturing();
  forgetStoredIds();
}

/** Removes the ids PostHog keeps in this browser. */
function forgetStoredIds() {
  try {
    for (const key of Object.keys(window.localStorage)) if (key.startsWith("ph_")) window.localStorage.removeItem(key);
  } catch {
    // Storage can be blocked; there is nothing to remove then.
  }
  for (const part of document.cookie.split(";")) {
    const name = part.trim().split("=")[0];
    if (name.startsWith("ph_")) document.cookie = `${name}=; Path=/; Max-Age=0`;
  }
}

/** Records a product event, if analytics is on. */
export function track(event: string, properties?: Record<string, string | number | boolean | null | undefined>) {
  later((ph) => ph.capture(event, properties));
}

function later(send: (ph: PostHog) => void) {
  if (instance) send(instance);
  else if (loading) void loading.then((ph) => ph && send(ph));
  else if (KEY && waiting.length < 20) waiting.push(send);
}

const NEW_DECK = "sz_new_deck";

/** Remembers, for this tab, that the person just made this deck, so its editor can report when it is finished. */
export function markNewDeck(id: string) {
  try {
    window.sessionStorage.setItem(NEW_DECK, id);
  } catch {
    // Storage can be blocked; the deck just isn't reported as finished.
  }
}

/** Whether this deck was just made in this tab; true once only. */
export function takeNewDeck(id: string): boolean {
  try {
    if (window.sessionStorage.getItem(NEW_DECK) !== id) return false;
    window.sessionStorage.removeItem(NEW_DECK);
    return true;
  } catch {
    return false;
  }
}

/** Reports an error that a page caught (React error boundaries stop it reaching the automatic capture). */
export function captureError(error: unknown) {
  later((ph) => ph.captureException(error));
}

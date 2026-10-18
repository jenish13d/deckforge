"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { chooseAnalytics, startAnalytics } from "@/lib/analytics-client";
import type { Consent } from "@/lib/consent";
import { SITE } from "@/lib/site";

/** Starts product analytics when allowed, and asks visitors who must be asked first. */
export function Analytics({ consent, userId, enabled }: { consent: Consent; userId: string | null; enabled: boolean }) {
  const [asking, setAsking] = useState(enabled && consent === "ask");

  useEffect(() => {
    if (enabled) void startAnalytics(consent, userId);
  }, [enabled, consent, userId]);

  if (!asking) return null;
  const choose = (allow: boolean) => {
    setAsking(false);
    void chooseAnalytics(allow, userId);
  };
  return (
    <section className="consent no-print" aria-label="Analytics cookies">
      <p>
        Can we use analytics cookies to see how {SITE.name} is used and fix what goes wrong? We never record what you type or your decks.{" "}
        <Link href="/privacy#analytics">Privacy</Link>
      </p>
      <div className="consent__actions">
        <button type="button" className="button" onClick={() => choose(false)}>No thanks</button>
        <button type="button" className="button button--primary" onClick={() => choose(true)}>Allow</button>
      </div>
    </section>
  );
}

/** The analytics switch on the Privacy page, for every visitor. */
export function AnalyticsChoice({ initial, userId, enabled }: { initial: Consent; userId: string | null; enabled: boolean }) {
  const [consent, setConsent] = useState(initial);
  if (!enabled) return <p className="muted">Analytics is not running on this site.</p>;

  const choose = (allow: boolean) => {
    setConsent(allow ? "granted" : "denied");
    void chooseAnalytics(allow, userId);
  };
  return (
    <div className="row" role="group" aria-label="Analytics choice">
      <button type="button" className="button button--primary" aria-pressed={consent === "granted"} onClick={() => choose(true)}>Allow analytics</button>
      <button type="button" className="button" aria-pressed={consent !== "granted"} onClick={() => choose(false)}>Turn analytics off</button>
      <span className="muted small" role="status">
        {consent === "granted" ? "Analytics is on." : consent === "denied" ? "Analytics is off." : "Analytics is off until you choose."}
      </span>
    </div>
  );
}

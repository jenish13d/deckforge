"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { api } from "@/lib/client";
import type { PaidPlanId } from "@/lib/plans";
import { Captcha } from "./Captcha";

interface PlanOption {
  id: PaidPlanId;
  label: string;
  price: string;
  credits: number;
}

/** Join the list for Pro or Max: one email when it opens, plus a confirmation now. */
export function WaitlistForm({
  plans,
  initialPlan,
  accountEmail,
  joined: alreadyJoined,
  captcha = false,
}: {
  plans: PlanOption[];
  initialPlan: PaidPlanId;
  /** Signed in: their account email is used. */
  accountEmail?: string;
  joined?: PaidPlanId | null;
  captcha?: boolean;
}) {
  const [plan, setPlan] = useState<PaidPlanId>(alreadyJoined ?? initialPlan);
  const [email, setEmail] = useState(accountEmail ?? "");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">(alreadyJoined ? "done" : "idle");
  const [error, setError] = useState("");
  const [altcha, setAltcha] = useState<string | null>(null);
  const needsCaptcha = captcha && !accountEmail;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setError("");
    try {
      await api("/api/waitlist", { body: { plan, email, website, altcha } });
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState("idle");
    }
  }

  const chosen = plans.find((p) => p.id === plan) ?? plans[0];
  if (state === "done") {
    return (
      <div className="panel waitlist waitlist--done" role="status">
        <span className="waitlist__check" aria-hidden="true">
          <Check size={22} />
        </span>
        <h2 className="waitlist__title">You&apos;re on the {chosen.label} list</h2>
        <p className="muted">
          We&apos;ll email <strong>{email || "you"}</strong> once when {chosen.label} opens. A confirmation is on its way; check spam if
          you don&apos;t see it. The Free plan keeps working until then.
        </p>
        <button type="button" className="button" onClick={() => setState("idle")}>
          Change plan
        </button>
      </div>
    );
  }

  return (
    <form className="panel waitlist" onSubmit={submit}>
      <fieldset className="waitlist__plans">
        <legend className="field__label">Which plan?</legend>
        {plans.map((p) => (
          <label key={p.id} className={`waitlist__plan${plan === p.id ? " is-selected" : ""}`}>
            <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} />
            <span className="waitlist__plan-name">{p.label}</span>
            <span className="waitlist__plan-price">{p.price}</span>
            <span className="muted small">{p.credits.toLocaleString("en-US")} credits a month</span>
          </label>
        ))}
      </fieldset>
      <label className="field">
        <span className="field__label">Email</span>
        <input
          className="input"
          type="email"
          name="email"
          autoComplete="email"
          spellCheck={false}
          required
          readOnly={Boolean(accountEmail)}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      {/* Hidden from people; bots fill it in. */}
      <input className="waitlist__trap" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} />
      {needsCaptcha && <Captcha onChange={setAltcha} />}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button button--primary" type="submit" disabled={state === "sending" || (needsCaptcha && !altcha)}>
        {state === "sending" ? "Adding you…" : `Email me when ${chosen.label} opens`}
      </button>
      <p className="muted small">One confirmation now and one email when it opens. Every email has a link to leave the list.</p>
    </form>
  );
}

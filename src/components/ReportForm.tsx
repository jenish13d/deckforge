"use client";

import { useState } from "react";

import { api } from "@/lib/client";
import { Captcha } from "./Captcha";

const REASONS = [
  "It uses my copyrighted work or photo",
  "It's harmful, hateful or illegal",
  "It contains false or misleading facts",
  "Something else",
];

/** Lets anyone report a shared deck; reports reach the team with the deck's address. */
export function ReportForm({ deckId, loggedIn, captcha }: { deckId: string; loggedIn: boolean; captcha: boolean }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [altcha, setAltcha] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const needsCaptcha = captcha && !loggedIn;

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setError("");
    try {
      await api("/api/feedback", {
        body: { message: `[Report] ${reason}\n\n${details}`, email, page: `/d/${deckId}`, altcha },
      });
      setState("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState("idle");
    }
  }

  if (state === "sent") {
    return <p className="success" role="status">Thank you. We&apos;ll review this deck and act on it if it breaks our rules.</p>;
  }

  return (
    <form className="report-form" onSubmit={send}>
      <fieldset className="settings__group">
        <legend className="settings__legend">What&apos;s wrong?</legend>
        {REASONS.map((r) => (
          <label key={r} className="settings__choice">
            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
            <span>{r}</span>
          </label>
        ))}
      </fieldset>
      <label className="field">
        <span className="field__label">Details</span>
        <textarea
          className="input"
          name="details"
          rows={4}
          maxLength={2500}
          required
          placeholder="Which slide, and what should change? For copyright, tell us where your original is…"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </label>
      {!loggedIn && (
        <label className="field">
          <span className="field__label">Your email (so we can reply)</span>
          <input
            className="input"
            type="email"
            name="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      )}
      {needsCaptcha && <Captcha onChange={setAltcha} />}
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="button button--primary" disabled={state === "sending" || !details.trim() || (needsCaptcha && !altcha)}>
        {state === "sending" ? "Sending…" : "Send report"}
      </button>
    </form>
  );
}

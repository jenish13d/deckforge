"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { api } from "@/lib/client";
import { Captcha } from "./Captcha";

/** "Launching soon": leave an email to hear once when the site opens. */
export function LaunchListForm({ captcha = false }: { captcha?: boolean }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [altcha, setAltcha] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setError("");
    try {
      await api("/api/launch-list", { body: { email, website, altcha } });
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="panel waitlist waitlist--done" role="status">
        <span className="waitlist__check" aria-hidden="true">
          <Check size={22} />
        </span>
        <h2 className="waitlist__title">You&apos;re on the list</h2>
        <p className="muted">
          We&apos;ll email <strong>{email}</strong> once, when we open. A confirmation is on its way; check spam if you don&apos;t see it.
        </p>
      </div>
    );
  }

  return (
    <form className="panel waitlist" onSubmit={submit}>
      <label className="field">
        <span className="field__label">Email</span>
        <input className="input" type="email" name="email" autoComplete="email" spellCheck={false} required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {/* Hidden from people; bots fill it in. */}
      <input className="waitlist__trap" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} />
      {captcha && <Captcha onChange={setAltcha} />}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button button--primary" type="submit" disabled={state === "sending" || (captcha && !altcha)}>
        {state === "sending" ? "Adding you…" : "Tell me when it opens"}
      </button>
      <p className="muted small">One confirmation now and one email when we open. Every email has a link to leave the list.</p>
    </form>
  );
}

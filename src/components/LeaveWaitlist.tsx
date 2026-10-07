"use client";

import Link from "next/link";
import { useState } from "react";

import { api } from "@/lib/client";

/** A button, not an automatic removal: mail scanners open links without anyone asking. */
export function LeaveWaitlist({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function leave() {
    setState("sending");
    setError("");
    try {
      await api("/api/waitlist/leave", { body: { token } });
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState("idle");
    }
  }

  return (
    <div className="panel auth-form">
      <h1 className="auth-form__title">{state === "done" ? "You've left the list" : "Leave the Pro list?"}</h1>
      {state === "done" ? (
        <p className="muted">You won&apos;t get any more emails about Pro opening. Your account, if you have one, is unchanged.</p>
      ) : (
        <>
          <p className="muted">You&apos;ll stop getting emails about Pro and Max opening.</p>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="button" className="button button--primary" disabled={!token || state === "sending"} onClick={leave}>
            {state === "sending" ? "Removing…" : "Leave the list"}
          </button>
          {!token && <p className="error">This link is incomplete. Use the link from the email.</p>}
        </>
      )}
      <Link href="/">Back to the home page</Link>
    </div>
  );
}

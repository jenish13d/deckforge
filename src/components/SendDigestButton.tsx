"use client";

import { useState } from "react";

import { api } from "@/lib/client";

/** Email me today's summary now (it also arrives by itself every morning). */
export function SendDigestButton({ ready }: { ready: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function send() {
    setState("sending");
    setError("");
    try {
      await api("/api/admin/digest", { body: {} });
      setState("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState("idle");
    }
  }

  return (
    <div className="stack">
      <button type="button" className="button" disabled={!ready || state === "sending"} onClick={send}>
        {state === "sending" ? "Sending…" : state === "sent" ? "Sent: check your inbox" : "Email me this summary now"}
      </button>
      {!ready && <p className="muted small">Email isn&apos;t set up yet (SMTP in Vercel).</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

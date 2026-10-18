"use client";

import { useState } from "react";

import { api } from "@/lib/client";

/** After launch: email the launch list that the site is open, in batches. */
export function OpenEmailButton({ waiting, ready, why }: { waiting: number; ready: boolean; why: string }) {
  const [state, setState] = useState<"idle" | "sending">("idle");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function send() {
    setState("sending");
    setError("");
    try {
      const r = await api<{ sent: number; failed: number; left: number }>("/api/admin/launch-list", { body: {} });
      setResult(`Sent ${r.sent}${r.failed ? `, ${r.failed} failed` : ""}. ${r.left} still to email${r.left ? ": press again for the next batch" : ""}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setState("idle");
  }

  return (
    <div className="stack">
      <button type="button" className="button" disabled={!ready || waiting === 0 || state === "sending"} onClick={send}>
        {state === "sending" ? "Sending…" : `Tell the list we're open (${waiting} waiting)`}
      </button>
      {!ready && why && <p className="muted small">{why}</p>}
      {result && <p role="status">{result}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

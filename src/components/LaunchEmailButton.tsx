"use client";

import { useState } from "react";

import { api } from "@/lib/client";

/** Admin: tell everyone on the list that paid plans are open (each person once). */
export function LaunchEmailButton({ waiting, ready, why }: { waiting: number; ready: boolean; why: string }) {
  const [left, setLeft] = useState(waiting);
  const [state, setState] = useState<"idle" | "sending">("idle");
  const [message, setMessage] = useState("");

  async function send() {
    if (!window.confirm(`Email ${left} ${left === 1 ? "person" : "people"} that paid plans are open?`)) return;
    setState("sending");
    setMessage("");
    try {
      const result = await api<{ sent: number; failed: number; left: number }>("/api/admin/waitlist", { body: {} });
      setLeft(result.left);
      setMessage(
        `Sent ${result.sent}.${result.failed ? ` ${result.failed} failed.` : ""}${result.left ? ` ${result.left} still to send: press again (or tomorrow if your email provider's daily limit is reached).` : " Everyone has been told."}`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setState("idle");
    }
  }

  return (
    <div className="stack">
      <button type="button" className="button button--primary" disabled={!ready || left === 0 || state === "sending"} onClick={send}>
        {state === "sending" ? "Sending…" : `Email the list that paid plans are open (${left})`}
      </button>
      {!ready && why && <p className="muted small">{why}</p>}
      {message && <p className="small" role="status">{message}</p>}
    </div>
  );
}

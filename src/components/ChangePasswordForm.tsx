"use client";

import { useState } from "react";

import { api } from "@/lib/client";
import { PasswordInput } from "./ui/PasswordInput";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("saving");
    setError("");
    try {
      await api("/api/auth/change-password", { body: { current, next } });
      setCurrent("");
      setNext("");
      setState("saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState("idle");
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2 className="section-title">Change password</h2>
      <label className="field">
        <span className="field__label">Current password</span>
        <PasswordInput aria-label="Current password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">New password</span>
        <PasswordInput aria-label="New password" autoComplete="new-password" minLength={8} required value={next} onChange={(e) => setNext(e.target.value)} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      {state === "saved" && <p className="success" role="status">Password changed. Other devices have been signed out.</p>}
      <div>
        <button className="button button--primary" type="submit" disabled={state === "saving"}>
          {state === "saving" ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}

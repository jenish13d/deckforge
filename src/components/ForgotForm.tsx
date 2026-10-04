"use client";

import Link from "next/link";
import { useState } from "react";

import { api } from "@/lib/client";
import { Captcha } from "./Captcha";

export function ForgotForm({ captcha = false }: { captcha?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [altcha, setAltcha] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setError("");
    try {
      await api("/api/auth/forgot", { body: { email, altcha } });
      setState("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="panel auth-form">
        <h1 className="auth-form__title">Check your email</h1>
        <p className="muted">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset the password. It works for 1 hour.
          Check your spam folder if you don&apos;t see it.
        </p>
        <Link href="/login">Back to log in</Link>
      </div>
    );
  }

  return (
    <form className="panel auth-form" onSubmit={submit}>
      <h1 className="auth-form__title">Forgot your password?</h1>
      <p className="muted">Enter your email and we&apos;ll send you a link to choose a new one.</p>
      <label className="field">
        <span className="field__label">Email</span>
        <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {captcha && <Captcha onChange={setAltcha} />}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button button--primary" type="submit" disabled={state === "sending" || (captcha && !altcha)}>
        {state === "sending" ? "Sending…" : "Send reset link"}
      </button>
      <Link href="/login">Back to log in</Link>
    </form>
  );
}

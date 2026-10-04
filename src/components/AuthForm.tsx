"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/client";

export function AuthForm({ mode, next = "/" }: { mode: "login" | "signup"; next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/api/auth/${mode}`, { body: { email, password } });
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <form className="panel auth-form" onSubmit={submit}>
      <h1 className="auth-form__title">{signup ? "Create your account" : "Welcome back"}</h1>
      {signup && <p className="muted">Free plan: 60 credits every month, no card needed.</p>}
      <label className="field">
        <span className="field__label">Email</span>
        <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">Password</span>
        <input
          className="input"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={signup ? 8 : undefined}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button button--primary" type="submit" disabled={busy}>
        {busy ? "Please wait…" : signup ? "Sign up free" : "Log in"}
      </button>
      {signup && (
        <p className="muted small">
          By signing up you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy policy</Link>.
        </p>
      )}
      <p className="muted">
        {signup ? (
          <>Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link></>
        ) : (
          <>New here? <Link href={`/signup?next=${encodeURIComponent(next)}`}>Create a free account</Link></>
        )}
      </p>
    </form>
  );
}

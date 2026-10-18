"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { track } from "@/lib/analytics-client";
import { ApiError, api } from "@/lib/client";
import { Captcha } from "./Captcha";
import { PasswordInput } from "./ui/PasswordInput";

export function AuthForm({
  mode,
  next = "/",
  captcha = false,
  invite = null,
}: {
  mode: "login" | "signup";
  next?: string;
  captcha?: boolean;
  /** Before launch: sign-up needs an invite code (prefilled from the invite link). */
  invite?: { code: string } | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [altcha, setAltcha] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const [code, setCode] = useState(invite?.code ?? "");
  const signup = mode === "signup";
  const needsCaptcha = signup && captcha;
  // Funnel: the first time someone starts filling in the sign-up form.
  const started = useRef(false);
  const onStart = () => {
    if (!signup || started.current) return;
    started.current = true;
    track("signup_started");
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/api/auth/${mode}`, { body: { email, password, altcha, remember, ...(invite ? { code } : {}) } });
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
      if (signup) track("signup_error", { status: e instanceof ApiError ? e.status : 0 });
    }
  }

  return (
    <form className="panel auth-form" onSubmit={submit} onFocus={onStart}>
      <h1 className="auth-form__title">{signup ? "Create your account" : "Welcome back"}</h1>
      {signup && !invite && <p className="muted">Free plan: 60 credits every month, no card needed.</p>}
      {signup && invite && <p className="muted">We&apos;re invite-only until launch. An invite account lasts 24 hours, then it is deleted with its decks.</p>}
      <label className="field">
        <span className="field__label">Email</span>
        <input className="input" type="email" name="email" autoComplete="email" spellCheck={false} required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">Password</span>
        <PasswordInput
          aria-label="Password"
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={signup ? 8 : undefined}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {signup && invite && (
        <label className="field">
          <span className="field__label">Invite code</span>
          <input className="input" name="code" autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} />
        </label>
      )}
      {!signup && (
        <div className="row row--between">
          <label className="checkbox">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
          </label>
          <Link href="/forgot-password" className="small">Forgot password?</Link>
        </div>
      )}
      {needsCaptcha && <Captcha onChange={setAltcha} />}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button button--primary" type="submit" disabled={busy || (needsCaptcha && !altcha)}>
        {busy ? "Please wait…" : signup ? (invite ? "Sign up" : "Sign up free") : "Log in"}
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
          <>New here? <Link href={`/signup?next=${encodeURIComponent(next)}`}>{invite ? "Sign up with an invite code" : "Create a free account"}</Link></>
        )}
      </p>
    </form>
  );
}

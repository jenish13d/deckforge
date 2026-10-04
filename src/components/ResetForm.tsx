"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/client";
import { PasswordInput } from "./ui/PasswordInput";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/reset", { body: { token, password } });
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <form className="panel auth-form" onSubmit={submit}>
      <h1 className="auth-form__title">Choose a new password</h1>
      <label className="field">
        <span className="field__label">New password</span>
        <PasswordInput aria-label="New password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">Repeat new password</span>
        <PasswordInput aria-label="Repeat new password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </label>
      {error && (
        <p className="error" role="alert">
          {error} {error.includes("expired") && <Link href="/forgot-password">Get a new link</Link>}
        </p>
      )}
      <button className="button button--primary" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}

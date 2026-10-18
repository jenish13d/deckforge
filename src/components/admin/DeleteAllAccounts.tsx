"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/client";
import { WIPE_CONFIRM } from "@/lib/prelaunch";

/** Before launch: delete every account except the admins'. Needs the confirmation typed out. */
export function DeleteAllAccounts({ count }: { count: number }) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<number | null>(null);

  async function wipe(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { deleted } = await api<{ deleted: number }>("/api/admin/accounts", { method: "DELETE", body: { confirm: typed } });
      setDone(deleted);
      setTyped("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  }

  if (done !== null) return <p role="status">Deleted {done} {done === 1 ? "account" : "accounts"} and their decks.</p>;
  if (count === 0) return <p className="muted">There are no accounts besides the admins&apos;.</p>;
  return (
    <form className="panel danger-zone stack" onSubmit={wipe}>
      <p>
        <strong>{count} {count === 1 ? "account" : "accounts"}</strong> besides the admins&apos;. Deleting removes them and all their decks for good. The
        waitlists and feedback stay.
      </p>
      <label className="field">
        <span className="field__label">Type {WIPE_CONFIRM} to confirm</span>
        <input className="input" value={typed} autoComplete="off" spellCheck={false} onChange={(e) => setTyped(e.target.value)} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="button button--danger" disabled={busy || typed !== WIPE_CONFIRM}>
        {busy ? "Deleting…" : "Delete all other accounts"}
      </button>
    </form>
  );
}

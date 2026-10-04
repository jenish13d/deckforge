"use client";

import { Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/client";
import { Modal } from "./ui/Modal";
import { PasswordInput } from "./ui/PasswordInput";

/** "Your data" section: download everything, or delete the account. */
export function AccountDataActions() {
  const [deleting, setDeleting] = useState(false);
  return (
    <section className="panel">
      <h2 className="section-title">Your data</h2>
      <p className="muted small">Download a copy of your account and all your decks, or delete your account for good.</p>
      <div className="row">
        <a className="button" href="/api/account/export" download>
          <Download size={16} aria-hidden="true" /> Download my data
        </a>
        <button type="button" className="button button--danger" onClick={() => setDeleting(true)}>
          <Trash2 size={16} aria-hidden="true" /> Delete account
        </button>
      </div>
      {deleting && <DeleteAccountDialog onClose={() => setDeleting(false)} />}
    </section>
  );
}

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/account/delete", { body: { password } });
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <Modal title="Delete your account?" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <p className="muted">
          This deletes your account and all your decks for good. Share links stop working. This can&apos;t be undone.
        </p>
        <label className="field">
          <span className="field__label">Type your password to confirm</span>
          <PasswordInput aria-label="Type your password to confirm" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error small" role="alert">{error}</p>}
        <div className="row row--end">
          <button type="button" className="button" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="button button--solid-danger" disabled={busy || !password}>
            {busy ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

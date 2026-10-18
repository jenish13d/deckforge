"use client";

import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/client";

export interface InviteRow {
  id: string;
  code: string;
  note: string;
  expiresAt: string;
  usedAt: string | null;
  usedBy: string | null;
}

const hoursLeft = (iso: string, now: number) => Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 3_600_000));

/** Make invite codes and see who used them. A code works once, within 24 hours; its account lasts 24 hours. */
export function InviteManager({ invites, origin, now }: { invites: InviteRow[]; origin: string; now: number }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [made, setMade] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const link = (code: string) => `${origin}/signup?code=${code}`;

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { code } = await api<{ code: string }>("/api/admin/invites", { body: { note } });
      setMade(code);
      setCopied(false);
      setNote("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  }

  async function revoke(id: string) {
    setError("");
    try {
      await api("/api/admin/invites", { method: "DELETE", body: { id } });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(link(code));
      setCopied(true);
    } catch {
      setError("Couldn't copy. Select the link and copy it yourself.");
    }
  }

  return (
    <div className="stack">
      <form className="row" onSubmit={create}>
        <label className="field invite-note">
          <span className="field__label">Who is it for? (optional)</span>
          <input className="input" value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Priya, design feedback" />
        </label>
        <button type="submit" className="button button--primary" disabled={busy}>{busy ? "Making…" : "Make an invite code"}</button>
      </form>
      {made && (
        <div className="panel invite-made" role="status">
          <p>
            Code <strong className="invite-code">{made}</strong>. Send this link; it works once, within 24 hours:
          </p>
          <div className="row">
            <code className="invite-link">{link(made)}</code>
            <button type="button" className="button button--small" onClick={() => copy(made)}>
              <Copy size={16} aria-hidden="true" /> {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      {invites.length === 0 ? (
        <p className="muted">No codes yet.</p>
      ) : (
        <ul className="feedback-list">
          {invites.map((i) => {
            const expired = !i.usedAt && new Date(i.expiresAt).getTime() <= now;
            return (
              <li key={i.id} className="feedback-item row row--between">
                <span>
                  <strong className="invite-code">{i.code}</strong>
                  {i.note && <span className="muted"> · {i.note}</span>}
                </span>
                <span className="muted small row">
                  {i.usedAt ? `Used by ${i.usedBy ?? "someone"}` : expired ? "Expired, unused" : `Unused · ${hoursLeft(i.expiresAt, now)} h left`}
                  {!i.usedAt && !expired && (
                    <button type="button" className="button button--small" onClick={() => revoke(i.id)}>Cancel</button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

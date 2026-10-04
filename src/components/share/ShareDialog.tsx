"use client";

import { Check, Copy, Globe, Lock, Mail, Share2 } from "lucide-react";
import { useState } from "react";

import { api } from "@/lib/client";
import { shareLinks, type ShareTarget } from "@/lib/share";
import { Modal } from "@/components/ui/Modal";
import { BRANDS } from "./brands";

function LinkedInLogo() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="currentColor" />
      <g fill="#fff">
        <circle cx="7" cy="7" r="1.8" />
        <rect x="5.4" y="9.5" width="3.2" height="9.5" />
        <path d="M10.6 9.5h3v1.4c.5-.9 1.6-1.6 3-1.6 2.6 0 3.2 1.7 3.2 4V19h-3.2v-5c0-1.2-.2-2.2-1.5-2.2s-1.6 1-1.6 2.1V19h-3.2z" />
      </g>
    </svg>
  );
}

function BrandLogo({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d={path} fill="currentColor" />
    </svg>
  );
}

const ICONS: Record<ShareTarget, { color: string; icon: React.ReactNode }> = {
  whatsapp: { color: BRANDS.whatsapp.color, icon: <BrandLogo path={BRANDS.whatsapp.path} /> },
  telegram: { color: BRANDS.telegram.color, icon: <BrandLogo path={BRANDS.telegram.path} /> },
  x: { color: BRANDS.x.color, icon: <BrandLogo path={BRANDS.x.path} /> },
  linkedin: { color: "#0A66C2", icon: <LinkedInLogo /> },
  facebook: { color: BRANDS.facebook.color, icon: <BrandLogo path={BRANDS.facebook.path} /> },
  reddit: { color: BRANDS.reddit.color, icon: <BrandLogo path={BRANDS.reddit.path} /> },
  email: { color: "#5b6576", icon: <Mail size={22} aria-hidden="true" /> },
};

/**
 * Share window: copy the link, send it to an app, or (owner only) turn link
 * sharing on and off.
 */
export function ShareDialog({
  deckId,
  title,
  shared: initialShared,
  canManage,
  onClose,
  onSharedChange,
}: {
  deckId: string;
  title: string;
  shared: boolean;
  canManage: boolean;
  onClose: () => void;
  onSharedChange?: (shared: boolean) => void;
}) {
  const [shared, setShared] = useState(initialShared);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const url = `${window.location.origin}/d/${deckId}`;
  const canNativeShare = typeof navigator.share === "function";

  async function toggle() {
    const next = !shared;
    setSaving(true);
    setError("");
    try {
      await api(`/api/decks/${deckId}`, { method: "PATCH", body: { shared: next } });
      setShared(next);
      onSharedChange?.(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers: select the text so the user can copy it.
      (document.getElementById("share-link") as HTMLInputElement | null)?.select();
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal title="Share" onClose={onClose}>
      {canManage && (
        <label className="share-access">
          <span className="share-access__icon" aria-hidden="true">{shared ? <Globe size={18} /> : <Lock size={18} />}</span>
          <span className="share-access__text">
            <strong>{shared ? "Anyone with the link can view" : "Private: only you"}</strong>
            <span className="muted small">
              {shared ? "People you send the link to can view and present it. Only you can edit." : "Turn on to share this deck with a link."}
            </span>
          </span>
          <input type="checkbox" className="switch" role="switch" checked={shared} disabled={saving} onChange={toggle} aria-label="Anyone with the link can view" />
        </label>
      )}
      {error && <p className="error small" role="alert">{error}</p>}

      <fieldset className="share-body" disabled={!shared}>
        <div className="share-link">
          <input id="share-link" className="input" readOnly value={url} aria-label="Link to this deck" onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="button button--primary" onClick={copy}>
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {copied ? "Copied" : "Copy link"}
          </button>
        </div>

        <div className="share-apps">
          {shareLinks(url, title).map((t) => (
            <a key={t.id} className="share-app" href={t.href} target="_blank" rel="noopener noreferrer" style={{ color: ICONS[t.id].color }} aria-disabled={!shared} tabIndex={shared ? undefined : -1}>
              <span className="share-app__icon">{ICONS[t.id].icon}</span>
              <span className="share-app__label">{t.label}</span>
            </a>
          ))}
          {canNativeShare && (
            <button type="button" className="share-app" style={{ color: "var(--primary)" }} onClick={() => navigator.share({ title, url }).catch(() => {})}>
              <span className="share-app__icon"><Share2 size={22} aria-hidden="true" /></span>
              <span className="share-app__label">More…</span>
            </button>
          )}
        </div>
      </fieldset>
    </Modal>
  );
}

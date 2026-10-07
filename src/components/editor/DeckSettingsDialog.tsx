"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

import { Modal } from "@/components/ui/Modal";
import type { CreditsPlace, DeckLook } from "@/lib/slides";
import { SITE } from "@/lib/site";

/** Badge, closing slide and where photo credits go. Changes apply at once. */
export function DeckSettingsDialog({
  look,
  canRemoveBadge,
  onChange,
  onClose,
}: {
  look: DeckLook;
  canRemoveBadge: boolean;
  onChange: (patch: Partial<DeckLook>) => void;
  onClose: () => void;
}) {
  const places: { id: CreditsPlace; label: string; note: string }[] = [
    { id: "slide", label: "On each photo", note: "A small credit in the corner of every photo." },
    { id: "end", label: "On a credits slide", note: "Slides stay clean; all credits are listed at the end." },
  ];
  return (
    <Modal title="Deck settings" onClose={onClose}>
      <div className="settings">
        <label className="settings__row">
          <span className="settings__text">
            <strong>“Made with {SITE.name}” badge</strong>
            <span className="muted small">
              {canRemoveBadge ? "A small badge in the corner of each slide." : (
                <>
                  Always on with the Free plan. <Link href="/account#upgrade"><Sparkles size={13} aria-hidden="true" /> Remove it with Pro</Link>
                </>
              )}
            </span>
          </span>
          <input
            type="checkbox"
            className="switch"
            role="switch"
            name="badge"
            checked={look.badge}
            disabled={!canRemoveBadge}
            onChange={(e) => onChange({ badge: e.target.checked })}
          />
        </label>

        <label className="settings__row">
          <span className="settings__text">
            <strong>Closing slide</strong>
            <span className="muted small">Ends the deck with “Made with {SITE.name}” and a link to make one.</span>
          </span>
          <input
            type="checkbox"
            className="switch"
            role="switch"
            name="endSlide"
            checked={look.endSlide}
            onChange={(e) => onChange({ endSlide: e.target.checked })}
          />
        </label>

        <fieldset className="settings__group">
          <legend className="settings__legend">Photo credits</legend>
          <p className="muted small settings__help">Photographers are always credited; their licences require it.</p>
          {places.map((p) => (
            <label key={p.id} className="settings__choice">
              <input type="radio" name="credits" value={p.id} checked={look.credits === p.id} onChange={() => onChange({ credits: p.id })} />
              <span>
                <strong>{p.label}</strong>
                <span className="muted small">{p.note}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </div>
    </Modal>
  );
}

"use client";

import { Check } from "lucide-react";

import { CardView } from "@/components/CardView";
import { Modal } from "@/components/ui/Modal";
import type { CardContent } from "@/lib/cards";
import { THEMES, type ThemeId } from "@/lib/themes";

/** Theme picker that previews the deck's own first slide in every theme. */
export function ThemeDialog({
  value,
  sample,
  onChange,
  onClose,
}: {
  value: string;
  sample: CardContent;
  onChange: (theme: ThemeId) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Choose a theme" onClose={onClose} wide>
      <div className="theme-choices" role="radiogroup" aria-label="Theme">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={value === t.id}
            className={`theme-choice${value === t.id ? " is-selected" : ""}`}
            onClick={() => onChange(t.id)}
          >
            <span className={`theme-choice__preview mini-card theme-${t.id}`} aria-hidden="true" inert>
              <CardView content={sample} preview />
            </span>
            <span className="theme-choice__name">
              {t.name}
              {value === t.id && <Check size={16} aria-hidden="true" />}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

"use client";

import { CardView } from "@/components/CardView";
import { emptyCard } from "@/lib/cards";
import { THEMES, type ThemeId } from "@/lib/themes";

/** Theme choice shown as the deck's own title slide in every theme. */
export function ThemePicker({ value, onChange, title = "Your deck" }: { value: string; onChange: (theme: ThemeId) => void; title?: string }) {
  const sample = { ...emptyCard(title || "Your deck"), layout: "title" as const };
  return (
    <div className="theme-picker" role="radiogroup" aria-label="Theme">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          role="radio"
          aria-checked={value === theme.id}
          className={`theme-swatch${value === theme.id ? " is-selected" : ""}`}
          onClick={() => onChange(theme.id)}
        >
          <span className={`theme-swatch__card mini-card theme-${theme.id}`} aria-hidden="true" inert>
            <CardView content={sample} preview />
          </span>
          <span className="theme-swatch__name">{theme.name}</span>
        </button>
      ))}
    </div>
  );
}

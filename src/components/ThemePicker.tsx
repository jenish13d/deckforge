"use client";

import { THEMES, type ThemeId } from "@/lib/themes";

export function ThemePicker({ value, onChange }: { value: string; onChange: (theme: ThemeId) => void }) {
  return (
    <div className="theme-picker" role="radiogroup" aria-label="Theme">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          role="radio"
          aria-checked={value === theme.id}
          className={`theme-swatch theme-${theme.id}${value === theme.id ? " is-selected" : ""}`}
          onClick={() => onChange(theme.id)}
        >
          <span className="theme-swatch__preview">Aa</span>
          <span className="theme-swatch__name">{theme.name}</span>
        </button>
      ))}
    </div>
  );
}

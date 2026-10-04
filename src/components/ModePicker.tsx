"use client";

import { MODES, MODE_IDS, type ModeId } from "@/lib/plans";

export function ModePicker({
  value,
  onChange,
  allowed,
}: {
  value: ModeId;
  onChange: (mode: ModeId) => void;
  allowed: ModeId[];
}) {
  return (
    <div className="mode-picker" role="radiogroup" aria-label="Quality mode">
      {MODE_IDS.map((id) => {
        const mode = MODES[id];
        const locked = !allowed.includes(id);
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            disabled={locked}
            className={`mode-option${value === id ? " is-selected" : ""}`}
            onClick={() => onChange(id)}
          >
            <span className="mode-option__name">
              {mode.icon} {mode.label} {locked && <span className="badge">Pro</span>}
            </span>
            <span className="mode-option__desc">{mode.description}</span>
            <span className="mode-option__cost">
              {mode.creditsPerCard} credit{mode.creditsPerCard === 1 ? "" : "s"} / card
            </span>
          </button>
        );
      })}
    </div>
  );
}

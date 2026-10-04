"use client";

import { ModeIcon } from "@/components/ModeIcon";
import { MODES, MODE_IDS, type ModeId } from "@/lib/plans";

export function ModePicker({
  value,
  onChange,
  allowed,
  comingSoon = [],
}: {
  value: ModeId;
  onChange: (mode: ModeId) => void;
  allowed: ModeId[];
  comingSoon?: ModeId[];
}) {
  return (
    <div className="mode-picker" role="radiogroup" aria-label="Quality mode">
      {MODE_IDS.map((id) => {
        const mode = MODES[id];
        const soon = comingSoon.includes(id);
        const locked = soon || !allowed.includes(id);
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
              <ModeIcon mode={id} /> {mode.label} {soon ? <span className="badge badge--muted">Soon</span> : locked && <span className="badge">Pro</span>}
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

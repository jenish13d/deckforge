"use client";

import { useState } from "react";

import { LAYOUTS, MAX_ITEMS, type CardContent, type Layout } from "@/lib/cards";

const LAYOUT_NAMES: Record<Layout, string> = {
  title: "Title",
  section: "Section divider",
  bullets: "Bullet points",
  columns: "Columns",
  stats: "Big numbers",
  quote: "Quote",
  timeline: "Timeline / steps",
};

export function CardEditForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: CardContent;
  onSave: (content: CardContent) => Promise<void>;
  onCancel: () => void;
}) {
  const [c, setC] = useState<CardContent>(initial);
  const [saving, setSaving] = useState(false);
  const usesItems = c.layout === "bullets" || c.layout === "columns" || c.layout === "timeline";

  const set = (patch: Partial<CardContent>) => setC((prev) => ({ ...prev, ...patch }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(c);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card-form" onSubmit={submit}>
      <div className="row">
        <label className="field field--inline">
          <span className="field__label">Layout</span>
          <select className="input" value={c.layout} onChange={(e) => set({ layout: e.target.value as Layout })}>
            {LAYOUTS.map((l) => (
              <option key={l} value={l}>{LAYOUT_NAMES[l]}</option>
            ))}
          </select>
        </label>
        <label className="field field--inline">
          <span className="field__label">Icon</span>
          <input className="input input--icon" value={c.icon} maxLength={4} onChange={(e) => set({ icon: e.target.value })} />
        </label>
      </div>

      <label className="field">
        <span className="field__label">Title</span>
        <input className="input" value={c.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} />
      </label>
      <label className="field">
        <span className="field__label">Subtitle</span>
        <input className="input" value={c.subtitle} maxLength={240} onChange={(e) => set({ subtitle: e.target.value })} />
      </label>

      {usesItems && (
        <fieldset className="fieldset">
          <legend className="field__label">Points</legend>
          {c.items.map((item, i) => (
            <div key={i} className="pair">
              <input
                className="input"
                placeholder="Heading"
                aria-label={`Point ${i + 1} heading`}
                value={item.heading}
                maxLength={80}
                onChange={(e) => set({ items: c.items.map((x, j) => (j === i ? { ...x, heading: e.target.value } : x)) })}
              />
              <textarea
                className="input input--small"
                placeholder="Text"
                aria-label={`Point ${i + 1} text`}
                rows={2}
                value={item.text}
                maxLength={280}
                onChange={(e) => set({ items: c.items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove point ${i + 1}`}
                onClick={() => set({ items: c.items.filter((_, j) => j !== i) })}
              >
                ×
              </button>
            </div>
          ))}
          {c.items.length < MAX_ITEMS && (
            <button type="button" className="button button--small" onClick={() => set({ items: [...c.items, { heading: "", text: "" }] })}>
              + Add point
            </button>
          )}
        </fieldset>
      )}

      {c.layout === "stats" && (
        <fieldset className="fieldset">
          <legend className="field__label">Numbers</legend>
          {c.stats.map((stat, i) => (
            <div key={i} className="pair">
              <input
                className="input input--value"
                placeholder="72%"
                aria-label={`Number ${i + 1} value`}
                value={stat.value}
                maxLength={16}
                onChange={(e) => set({ stats: c.stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })}
              />
              <input
                className="input"
                placeholder="What it means"
                aria-label={`Number ${i + 1} label`}
                value={stat.label}
                maxLength={80}
                onChange={(e) => set({ stats: c.stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove number ${i + 1}`}
                onClick={() => set({ stats: c.stats.filter((_, j) => j !== i) })}
              >
                ×
              </button>
            </div>
          ))}
          {c.stats.length < 4 && (
            <button type="button" className="button button--small" onClick={() => set({ stats: [...c.stats, { value: "", label: "" }] })}>
              + Add number
            </button>
          )}
        </fieldset>
      )}

      {c.layout === "quote" && (
        <>
          <label className="field">
            <span className="field__label">Quote</span>
            <textarea className="input" rows={3} value={c.quote} maxLength={300} onChange={(e) => set({ quote: e.target.value })} />
          </label>
          <label className="field">
            <span className="field__label">Said by</span>
            <input className="input" value={c.quoteAuthor} maxLength={80} onChange={(e) => set({ quoteAuthor: e.target.value })} />
          </label>
        </>
      )}

      <div className="row row--end">
        <button type="button" className="button" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="button button--primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
      </div>
    </form>
  );
}

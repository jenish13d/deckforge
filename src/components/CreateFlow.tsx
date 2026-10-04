"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Link from "next/link";

import { ModePicker } from "@/components/ModePicker";
import { ThemePicker } from "@/components/ThemePicker";
import { MAX_CARDS, MIN_CARDS, type Outline } from "@/lib/cards";
import { api } from "@/lib/client";
import { DEFAULT_MODE, cardCost, type ModeId } from "@/lib/plans";
import { TEMPLATES } from "@/lib/templates";
import type { ThemeId } from "@/lib/themes";

interface EditableCard {
  key: number;
  title: string;
  points: string;
}

let nextKey = 0;
const toEditable = (outline: Outline): EditableCard[] =>
  outline.cards.map((c) => ({ key: nextKey++, title: c.title, points: c.points.join("\n") }));

export function CreateFlow({
  allowedModes,
  comingSoon = [],
  credits,
  initialPrompt = "",
  initialTheme = "minimal",
}: {
  allowedModes: ModeId[];
  comingSoon?: ModeId[];
  credits: number;
  initialPrompt?: string;
  initialTheme?: ThemeId;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ModeId>(DEFAULT_MODE);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [cardCount, setCardCount] = useState(8);
  const [theme, setTheme] = useState<ThemeId>(initialTheme);
  const [title, setTitle] = useState("");
  const [cards, setCards] = useState<EditableCard[] | null>(null);
  const [busy, setBusy] = useState<"outline" | "deck" | null>(null);
  const [error, setError] = useState("");

  async function makeOutline(event: React.FormEvent) {
    event.preventDefault();
    setBusy("outline");
    setError("");
    try {
      const outline = await api<Outline>("/api/outline", { body: { prompt, cardCount } });
      setTitle(outline.title);
      setCards(toEditable(outline));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function makeDeck() {
    if (!cards) return;
    setBusy("deck");
    setError("");
    try {
      const outline = cards
        .filter((c) => c.title.trim())
        .map((c) => ({ title: c.title, points: c.points.split("\n").map((p) => p.trim()).filter(Boolean) }));
      const { id } = await api<{ id: string }>("/api/decks", {
        body: { prompt, title, theme, mode, outline },
      });
      router.push(`/d/${id}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  }

  const update = (key: number, patch: Partial<EditableCard>) =>
    setCards((list) => list?.map((c) => (c.key === key ? { ...c, ...patch } : c)) ?? null);

  if (!cards) {
    return (
      <form className="panel" onSubmit={makeOutline}>
        <label className="field">
          <span className="field__label">Your topic</span>
          <textarea
            className="input input--large"
            rows={4}
            maxLength={4000}
            required
            placeholder="Describe your topic, audience and goal. Paste notes if you have them."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </label>

        <div className="chips" aria-label="Start from a template">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className="chip"
              onClick={() => {
                setPrompt(t.prompt);
                setTheme(t.theme);
              }}
            >
              {t.icon} {t.name}
            </button>
          ))}
        </div>
        {/\[[^\]]+\]/.test(prompt) && (
          <p className="muted small">Replace the parts in [brackets] with your details for the best result.</p>
        )}

        <div className="row">
          <label className="field field--inline">
            <span className="field__label">Cards</span>
            <select className="input" value={cardCount} onChange={(e) => setCardCount(Number(e.target.value))}>
              {Array.from({ length: MAX_CARDS - MIN_CARDS + 1 }, (_, i) => MIN_CARDS + i).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <button className="button button--primary" type="submit" disabled={busy !== null || !prompt.trim()}>
            {busy === "outline" ? "Planning…" : "Generate outline"}
          </button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
      </form>
    );
  }

  return (
    <div className="panel">
      <label className="field">
        <span className="field__label">Deck title</span>
        <input className="input input--large" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <p className="muted">Edit the outline: rename cards, change the key points (one per line), add or remove cards.</p>
      <ol className="outline">
        {cards.map((card, i) => (
          <li key={card.key} className="outline__item">
            <span className="outline__number">{i + 1}</span>
            <div className="outline__fields">
              <input
                className="input"
                aria-label={`Card ${i + 1} title`}
                value={card.title}
                maxLength={120}
                onChange={(e) => update(card.key, { title: e.target.value })}
              />
              <textarea
                className="input input--small"
                aria-label={`Card ${i + 1} key points`}
                rows={2}
                value={card.points}
                onChange={(e) => update(card.key, { points: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label={`Remove card ${i + 1}`}
              onClick={() => setCards((list) => list?.filter((c) => c.key !== card.key) ?? null)}
            >
              ×
            </button>
          </li>
        ))}
      </ol>
      {cards.length < MAX_CARDS && (
        <button
          type="button"
          className="button"
          onClick={() => setCards((list) => [...(list ?? []), { key: nextKey++, title: "", points: "" }])}
        >
          + Add card
        </button>
      )}

      <h3 className="section-title">Theme</h3>
      <ThemePicker value={theme} onChange={setTheme} />

      <h3 className="section-title">Quality</h3>
      <ModePicker value={mode} onChange={setMode} allowed={allowedModes} comingSoon={comingSoon} />
      {!allowedModes.includes("premium") && !comingSoon.includes("premium") && (
        <p className="muted small">
          Premium needs Pro. <Link href="/account#upgrade">See plans</Link>
        </p>
      )}
      <CostLine cost={cardCost(mode, cards.filter((c) => c.title.trim()).length)} credits={credits} />

      <div className="row row--end">
        <button type="button" className="button" onClick={() => setCards(null)} disabled={busy !== null}>
          Back
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={makeDeck}
          disabled={
            busy !== null ||
            !cards.some((c) => c.title.trim()) ||
            cardCost(mode, cards.filter((c) => c.title.trim()).length) > credits
          }
        >
          {busy === "deck" ? "Creating…" : "Generate deck"}
        </button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

function CostLine({ cost, credits }: { cost: number; credits: number }) {
  const enough = cost <= credits;
  return (
    <p className={enough ? "cost-line" : "cost-line cost-line--short"}>
      This deck uses <strong>{cost} credits</strong>. You have {credits}.
      {!enough && (
        <>
          {" "}Remove some cards, pick a cheaper mode, or <Link href="/account#upgrade">upgrade to Pro</Link>.
        </>
      )}
    </p>
  );
}

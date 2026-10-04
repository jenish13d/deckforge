"use client";

import { ArrowRight, ArrowUp, ChevronDown, ClipboardPaste, Layers, LayoutTemplate, LoaderCircle, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { HeroArt } from "@/components/art/HeroArt";
import { CardView } from "@/components/CardView";
import { ModePicker } from "@/components/ModePicker";
import { TemplateIcon } from "@/components/TemplateIcon";
import { ThemePicker } from "@/components/ThemePicker";
import { MAX_CARDS, MIN_CARDS, type Outline } from "@/lib/cards";
import { api } from "@/lib/client";
import { DEFAULT_MODE, cardCost, type ModeId } from "@/lib/plans";
import { TEMPLATES, type Template } from "@/lib/templates";
import type { ThemeId } from "@/lib/themes";

interface EditableCard {
  key: number;
  title: string;
  points: string;
}

const SAMPLES = [
  "A 5-minute talk for college students on why sleep matters, with simple tips",
  "The history of pizza, from Naples to the whole world",
  "Pitch for a neighborhood coffee subscription: problem, offer, pricing and launch plan",
  "Introduction to climate change for 10-year-olds, with examples they can relate to",
  "Quarterly results for a small online shop: sales, best sellers, problems and next steps",
];

let nextKey = 0;
const toEditable = (outline: Outline): EditableCard[] =>
  outline.cards.map((c) => ({ key: nextKey++, title: c.title, points: c.points.join("\n") }));

export function CreateFlow({
  allowedModes,
  comingSoon = [],
  credits,
  greetingName,
  initialPrompt = "",
  initialTheme = "milano",
}: {
  allowedModes: ModeId[];
  comingSoon?: ModeId[];
  credits: number;
  /** Shown as "Ciao, name!" above the prompt. */
  greetingName?: string;
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
  const [tab, setTab] = useState<"start" | "templates">("start");
  const [placeholder, setPlaceholder] = useState("Describe your topic, audience and goal…");
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const sampleIndex = useRef(-1);

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

  function applyTemplate(template: Template) {
    setPrompt(template.prompt);
    setTheme(template.theme);
    focusPrompt();
  }

  function focusPrompt(placeholderText?: string) {
    if (placeholderText) setPlaceholder(placeholderText);
    promptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    promptRef.current?.focus({ preventScroll: true });
  }

  function trySample() {
    sampleIndex.current = (sampleIndex.current + 1) % SAMPLES.length;
    setPrompt(SAMPLES[sampleIndex.current]);
    focusPrompt();
  }

  if (!cards) {
    return (
      <div className="create-start">
        <HeroArt className="create-start__art" />
        {greetingName && <p className="create-start__hello">Ciao, {greetingName}!</p>}
        <h1 className="create-start__title">What do you want to <em>present</em>?</h1>

        <form className="prompt-box" onSubmit={makeOutline}>
          <textarea
            ref={promptRef}
            className="prompt-box__input"
            rows={3}
            maxLength={4000}
            required
            aria-label="Your topic"
            placeholder={placeholder}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
            }}
          />
          <div className="prompt-box__bar">
            <label className="pill-select">
              <Layers size={15} aria-hidden="true" />
              <select aria-label="Number of cards" value={cardCount} onChange={(e) => setCardCount(Number(e.target.value))}>
                {Array.from({ length: MAX_CARDS - MIN_CARDS + 1 }, (_, i) => MIN_CARDS + i).map((n) => (
                  <option key={n} value={n}>{n} cards</option>
                ))}
              </select>
              <ChevronDown size={15} aria-hidden="true" className="pill-select__chevron" />
            </label>
            <span className="prompt-box__hint">The outline is free</span>
            <button
              className="send-button"
              type="submit"
              aria-label="Generate outline"
              title="Generate outline"
              disabled={busy !== null || !prompt.trim()}
            >
              {busy === "outline" ? <LoaderCircle size={20} className="spin" aria-hidden="true" /> : <ArrowUp size={20} aria-hidden="true" />}
            </button>
          </div>
        </form>
        {busy === "outline" && <p className="status center" role="status">Planning your outline…</p>}
        {/\[[^\]]+\]/.test(prompt) && (
          <p className="muted small center">Replace the parts in [brackets] with your details for the best result.</p>
        )}
        {error && <p className="error center" role="alert">{error}</p>}

        <div className="quick-chips" aria-label="Start from a template">
          {TEMPLATES.map((t) => (
            <button key={t.id} type="button" className="quick-chip" onClick={() => applyTemplate(t)}>
              <TemplateIcon id={t.id} /> {t.name}
            </button>
          ))}
        </div>

        <div className="tabs" role="tablist" aria-label="Ideas">
          <button type="button" role="tab" aria-selected={tab === "start"} className="tab" onClick={() => setTab("start")}>
            Get started
          </button>
          <button type="button" role="tab" aria-selected={tab === "templates"} className="tab" onClick={() => setTab("templates")}>
            Templates
          </button>
        </div>

        {tab === "start" ? (
          <div className="starter-grid" role="tabpanel">
            <button type="button" className="starter" onClick={trySample}>
              <Zap size={20} aria-hidden="true" className="starter__icon" />
              <strong>Take it for a test drive</strong>
              <span>Fill in a sample topic and watch a deck being made.</span>
              <span className="starter__cta">Try a sample <ArrowRight size={14} aria-hidden="true" /></span>
            </button>
            <button type="button" className="starter" onClick={() => focusPrompt("Paste your notes, an outline or a whole document here…")}>
              <ClipboardPaste size={20} aria-hidden="true" className="starter__icon" />
              <strong>Turn notes into slides</strong>
              <span>Paste notes, an outline or a document. We&apos;ll shape it into cards.</span>
              <span className="starter__cta">Paste my notes <ArrowRight size={14} aria-hidden="true" /></span>
            </button>
            <button type="button" className="starter" onClick={() => setTab("templates")}>
              <LayoutTemplate size={20} aria-hidden="true" className="starter__icon" />
              <strong>Start from a template</strong>
              <span>Pitch decks, reports, lessons, proposals and more.</span>
              <span className="starter__cta">Browse templates <ArrowRight size={14} aria-hidden="true" /></span>
            </button>
          </div>
        ) : (
          <div className="template-grid template-grid--app scroll-row" role="tabpanel">
            {TEMPLATES.map((t) => (
              <button key={t.id} type="button" className="template-tile" onClick={() => applyTemplate(t)}>
                <div className={`template-tile__preview mini-card theme-${t.theme}`}>
                  <CardView content={t.preview} />
                </div>
                <strong className="template-tile__name"><TemplateIcon id={t.id} /> {t.name}</strong>
                <span className="muted small">{t.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="panel outline-panel">
      <div className="row row--between">
        <h1 className="outline-panel__title">Review your outline</h1>
        <span className="muted small">Step 2 of 2</span>
      </div>
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

"use client";

import { ArrowLeft, ArrowRight, ArrowUp, ChevronDown, ClipboardPaste, Layers, LayoutTemplate, LoaderCircle, Plus, Sparkles, X, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { CardView } from "@/components/CardView";
import { PlanningStage } from "@/components/create/PlanningStage";
import { SetupStep } from "@/components/create/SetupStep";
import { HeroStage } from "@/components/landing/HeroStage";
import { ModePicker } from "@/components/ModePicker";
import { SourcesList } from "@/components/SourcesList";
import { TemplateIcon } from "@/components/TemplateIcon";
import { ThemePicker } from "@/components/ThemePicker";
import { MAX_CARDS, MIN_CARDS, type Outline } from "@/lib/cards";
import { api } from "@/lib/client";
import { DEFAULT_MODE, cardCost, type ModeId } from "@/lib/plans";
import type { Source } from "@/lib/research";
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
  const [research, setResearch] = useState<{ sources: Source[]; id: string | null }>({ sources: [], id: null });
  const [busy, setBusy] = useState<"outline" | "deck" | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"start" | "templates">("start");
  const [stage, setStage] = useState<"start" | "setup">("start");
  // The topic plus the chosen audience and focus: what the outline and every card are written from.
  const [brief, setBrief] = useState("");
  const [placeholder, setPlaceholder] = useState("Describe your topic, audience and goal…");
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const sampleIndex = useRef(-1);

  function startSetup(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim()) return;
    setError("");
    setStage("setup");
    window.scrollTo({ top: 0 });
  }

  async function makeOutline(audience: string, angle: string) {
    const full = `${prompt.trim()}\n\nAudience: ${audience}\nFocus: ${angle}`;
    setBrief(full);
    setBusy("outline");
    setError("");
    try {
      const outline = await api<Outline & { sources: Source[]; researchId: string | null }>("/api/outline", { body: { prompt: full, cardCount } });
      setTitle(outline.title);
      setCards(toEditable(outline));
      setResearch({ sources: outline.sources ?? [], id: outline.researchId ?? null });
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
        body: { prompt: brief || prompt, title, theme, mode, outline, researchId: research.id },
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
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    promptRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    promptRef.current?.focus({ preventScroll: true });
  }

  function trySample() {
    sampleIndex.current = (sampleIndex.current + 1) % SAMPLES.length;
    setPrompt(SAMPLES[sampleIndex.current]);
    focusPrompt();
  }

  if (!cards && busy === "outline") return <PlanningStage topic={prompt.trim()} cardCount={cardCount} />;

  if (!cards && stage === "setup") {
    return (
      <>
        <SetupStep
          topic={prompt.trim()}
          cardCount={cardCount}
          onCardCount={setCardCount}
          onBack={() => setStage("start")}
          onContinue={(audience, angle) => void makeOutline(audience, angle)}
        />
        {error && <p className="error center" role="alert">{error}</p>}
      </>
    );
  }

  if (!cards) {
    return (
      <div className="create-start">
        <HeroStage compact />
        {greetingName && <p className="create-start__hello">Ciao, {greetingName}!</p>}
        <h1 className="create-start__title">What do you want to <em>present</em>?</h1>

        <form className="prompt-box" onSubmit={startSetup}>
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
              aria-label="Continue"
              title="Continue"
              disabled={busy !== null || !prompt.trim()}
            >
              {busy === "outline" ? <LoaderCircle size={20} className="spin" aria-hidden="true" /> : <ArrowUp size={20} aria-hidden="true" />}
            </button>
          </div>
        </form>
        {/\[[^\]]+\]/.test(prompt) && (
          <p className="muted small center">Replace the parts in [brackets] with your details for the best result.</p>
        )}
        {error && <p className="error center" role="alert">{error}</p>}

        <div className="quick-chips" role="group" aria-label="Start from a template">
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
                <div className={`template-tile__preview mini-card theme-${t.theme}`} aria-hidden="true" inert>
                  <CardView content={t.preview} preview />
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

  const usedCards = cards.filter((c) => c.title.trim()).length;
  const cost = cardCost(mode, usedCards);

  return (
    <div className="outline-step">
      <div className="outline-step__main">
        <button type="button" className="back-link" onClick={() => { setCards(null); setStage("start"); }} disabled={busy !== null}>
          <ArrowLeft size={16} aria-hidden="true" /> Change topic
        </button>
        <h1 className="outline-panel__title">Shape your outline</h1>
        <p className="muted">Rename, reorder or cut cards before anything is written. One key point per line.</p>
        <label className="field">
          <span className="field__label">Deck title</span>
          <input className="input input--large" name="title" autoComplete="off" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <SourcesList sources={research.sources} compact />
        <ol className="outline">
          {cards.map((card, i) => (
            <li key={card.key} className="outline__item" style={{ "--i": i } as React.CSSProperties}>
              <span className="outline__number">{i + 1}</span>
              <div className="outline__fields">
                <input
                  className="outline__title"
                  aria-label={`Card ${i + 1} title`}
                  placeholder="Card title"
                  autoComplete="off"
                  value={card.title}
                  maxLength={120}
                  onChange={(e) => update(card.key, { title: e.target.value })}
                />
                <textarea
                  className="outline__points"
                  aria-label={`Card ${i + 1} key points`}
                  placeholder="Key points, one per line (optional)"
                  rows={Math.max(1, card.points.split("\n").length)}
                  value={card.points}
                  onChange={(e) => update(card.key, { points: e.target.value })}
                />
              </div>
              <button
                type="button"
                className="tool tool--danger outline__remove"
                aria-label={`Remove card ${i + 1}`}
                title="Remove card"
                onClick={() => setCards((list) => list?.filter((c) => c.key !== card.key) ?? null)}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
        {cards.length < MAX_CARDS && (
          <button
            type="button"
            className="outline__add"
            onClick={() => setCards((list) => [...(list ?? []), { key: nextKey++, title: "", points: "" }])}
          >
            <Plus size={16} aria-hidden="true" /> Add card
          </button>
        )}
      </div>

      <aside className="outline-step__side" aria-label="Look and quality">
        <h2 className="section-title">Theme</h2>
        <ThemePicker value={theme} onChange={setTheme} title={title} />

        <h2 className="section-title">Quality</h2>
        <ModePicker value={mode} onChange={setMode} allowed={allowedModes} comingSoon={comingSoon} />
        {!allowedModes.includes("premium") && !comingSoon.includes("premium") && (
          <p className="muted small">
            Premium needs Pro. <Link href="/account#upgrade">See plans</Link>
          </p>
        )}
        <div className="outline-step__go">
          <CostLine cost={cost} credits={credits} />
          <button
            type="button"
            className="button button--primary button--large"
            onClick={makeDeck}
            disabled={busy !== null || usedCards === 0 || cost > credits}
          >
            {busy === "deck" ? <LoaderCircle size={18} className="spin" aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
            {busy === "deck" ? "Creating…" : `Generate ${usedCards} cards`}
          </button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
      </aside>
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

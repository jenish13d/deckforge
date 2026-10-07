"use client";

import { ArrowLeft, Paperclip, Pencil, Sparkles } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Spinner3D } from "@/components/Spinner3D";
import { api } from "@/lib/client";
import type { Material } from "@/lib/material";

const NO_MATERIAL: Material[] = [];

interface Choices {
  audiences: string[];
  angles: string[];
}

// Used when the suggestions can't be loaded, so the step never blocks.
const GENERAL: Choices = {
  audiences: ["A general audience: a clear overview", "Students: easy to follow, with examples", "Colleagues or clients: the key facts fast"],
  angles: ["The big picture and the main facts", "The story, from the start to today", "What it means and what to do next"],
};

const DEPTHS = [
  { id: "low", label: "Low", note: "Short and sharp" },
  { id: "medium", label: "Medium", note: "Full, presentation-ready" },
  { id: "high", label: "High", note: "Detailed, researched wider" },
] as const;

type Depth = (typeof DEPTHS)[number]["id"];

const LENGTHS = [
  { cards: 6, label: "Quick", note: "6 cards" },
  { cards: 8, label: "Standard", note: "8 cards" },
  { cards: 12, label: "Deep dive", note: "12 cards" },
];

/** One question with a few choices and a "Something else" field. */
function Question({
  title,
  options,
  value,
  onChange,
  loading,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
}) {
  const id = useId();
  const custom = !options.includes(value);
  return (
    <fieldset className="setup-q">
      <legend className="setup-q__title">{title}</legend>
      <div className="setup-q__options" role="radiogroup" aria-labelledby={`${id}-t`}>
        <span id={`${id}-t`} className="sr-only">{title}</span>
        {loading
          ? [0, 1, 2].map((i) => <span key={i} className="setup-q__skeleton" style={{ "--i": i } as React.CSSProperties} />)
          : options.map((option, i) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={value === option}
                className="setup-option"
                style={{ "--i": i } as React.CSSProperties}
                onClick={() => onChange(option)}
              >
                <span className="setup-option__n" aria-hidden="true">{i + 1}</span>
                {option}
              </button>
            ))}
        <label className={`setup-option setup-option--custom${custom && value ? " is-on" : ""}`}>
          <Pencil size={15} aria-hidden="true" />
          <input
            className="setup-option__input"
            name={`${id}-custom`}
            autoComplete="off"
            maxLength={120}
            placeholder="Something else…"
            value={custom ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </div>
    </fieldset>
  );
}

/** Gamma-style quick choices between the topic and the outline, tailored to the topic. */
export function SetupStep({
  topic,
  material = NO_MATERIAL,
  cardCount,
  onCardCount,
  depth,
  onDepth,
  allowedDepths,
  onBack,
  onContinue,
}: {
  topic: string;
  /** Files the deck will be built from. */
  material?: Material[];
  cardCount: number;
  onCardCount: (count: number) => void;
  depth: Depth;
  onDepth: (depth: Depth) => void;
  /** Detail levels the plan includes (Free: Medium). */
  allowedDepths: readonly Depth[];
  onBack: () => void;
  onContinue: (audience: string, angle: string) => void;
}) {
  const [choices, setChoices] = useState<Choices | null>(null);
  const [audience, setAudience] = useState("");
  const [angle, setAngle] = useState("");

  useEffect(() => {
    let live = true;
    api<Choices>("/api/setup", { body: { prompt: topic, material } })
      .then((c) => (c.audiences.length && c.angles.length ? c : GENERAL))
      .catch(() => GENERAL)
      .then((c) => {
        if (!live) return;
        setChoices(c);
        setAudience((a) => a || c.audiences[0]);
        setAngle((a) => a || c.angles[0]);
      });
    return () => {
      live = false;
    };
  }, [topic, material]);

  const loading = choices === null;
  return (
    <div className="setup">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" /> Change topic
      </button>
      <p className="setup__topic">“{topic.length > 140 ? `${topic.slice(0, 140)}…` : topic}”</p>
      {material.length > 0 && (
        <p className="setup__files">
          <Paperclip size={14} aria-hidden="true" /> Built from {material.length === 1 ? material[0].name : `${material.length} files`}
        </p>
      )}
      <h1 className="setup__title">A few quick choices</h1>
      <p className="muted setup__lead">So the deck lands with the people who will see it.</p>
      {loading && (
        <p className="setup__thinking" role="status">
          <Spinner3D size={18} /> Reading your {material.length ? "files" : "topic"} for ideas…
        </p>
      )}

      <Question title="Who is it for?" options={choices?.audiences ?? []} value={audience} onChange={setAudience} loading={loading} />
      <Question title="What should it focus on?" options={choices?.angles ?? []} value={angle} onChange={setAngle} loading={loading} />

      <fieldset className="setup-q">
        <legend className="setup-q__title">How long?</legend>
        <div className="setup-q__options setup-q__options--row" role="radiogroup" aria-label="How long?">
          {LENGTHS.map((l) => (
            <button
              key={l.cards}
              type="button"
              role="radio"
              aria-checked={cardCount === l.cards}
              className="setup-option setup-option--length"
              onClick={() => onCardCount(l.cards)}
            >
              <strong>{l.label}</strong>
              <span>{l.note}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="setup-q">
        <legend className="setup-q__title">How much detail?</legend>
        <div className="setup-q__options setup-q__options--row" role="radiogroup" aria-label="How much detail?">
          {DEPTHS.map((d) => {
            const locked = !allowedDepths.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={depth === d.id}
                disabled={locked}
                className="setup-option setup-option--length"
                onClick={() => onDepth(d.id)}
              >
                <strong>
                  {d.label} {locked && <span className="badge">Pro</span>}
                </strong>
                <span>{d.note}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <button
        type="button"
        className="button button--primary button--large setup__go"
        disabled={loading || !audience.trim() || !angle.trim()}
        onClick={() => onContinue(audience.trim(), angle.trim())}
      >
        <Sparkles size={18} aria-hidden="true" /> Create outline
      </button>
    </div>
  );
}

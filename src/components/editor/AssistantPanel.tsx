"use client";

import { ArrowUp, LoaderCircle, Palette, Plus, Sparkles, WandSparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Assist } from "@/lib/cards";
import { api } from "@/lib/client";
import { THEMES } from "@/lib/themes";

type Action = Assist["actions"][number];

interface Message {
  from: "you" | "ai";
  text: string;
  actions?: Action[];
  applied?: boolean;
}

const SUGGESTIONS = ["Add a slide that sums up the key numbers", "Make slide 2 shorter and punchier", "Try a darker theme"];

function describe(action: Action): string {
  if (action.type === "add") return `Add “${action.title}” after slide ${action.slide}`;
  if (action.type === "rewrite") return `Rewrite slide ${action.slide}: ${action.instruction}`;
  return `Switch to the ${THEMES.find((t) => t.id === action.theme)?.name ?? action.theme} theme`;
}

const ICONS = { add: Plus, rewrite: WandSparkles, theme: Palette } as const;

/**
 * "Ask Slidezza": type a change in plain words, see what the assistant proposes, then apply it.
 * Nothing changes (and no credits are spent) until Apply is pressed.
 */
export function AssistantPanel({
  deckId,
  creditsPerRewrite,
  onApply,
  onClose,
}: {
  deckId: string;
  creditsPerRewrite: number;
  onApply: (actions: Action[]) => void;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { from: "ai", text: "Ciao! Tell me what to change: add a slide, rewrite one, or try another look." },
  ]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const list = useRef<HTMLOListElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    list.current?.lastElementChild?.scrollIntoView({ block: "end" });
  }, [messages, thinking]);

  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || thinking) return;
    setDraft("");
    setMessages((m) => [...m, { from: "you", text: message }]);
    setThinking(true);
    try {
      const result = await api<Assist>(`/api/decks/${deckId}/assist`, { body: { message } });
      setMessages((m) => [...m, { from: "ai", text: result.reply || "Here's what I'd change.", actions: result.actions }]);
    } catch (e) {
      setMessages((m) => [...m, { from: "ai", text: e instanceof Error ? e.message : "Something went wrong. Please try again." }]);
    } finally {
      setThinking(false);
    }
  }

  function apply(index: number) {
    const actions = messages[index].actions ?? [];
    onApply(actions);
    setMessages((m) => m.map((msg, i) => (i === index ? { ...msg, applied: true } : msg)));
  }

  return (
    <aside className="assistant" aria-label="Ask Slidezza">
      <header className="assistant__head">
        <span className="assistant__title">
          <Sparkles size={16} aria-hidden="true" /> Ask Slidezza
        </span>
        <button type="button" className="tool" aria-label="Close the assistant" onClick={onClose}>
          <X size={16} aria-hidden="true" />
        </button>
      </header>

      <ol ref={list} className="assistant__messages" aria-live="polite">
        {messages.map((m, i) => (
          <li key={i} className={`assistant__msg assistant__msg--${m.from}`}>
            <p>{m.text}</p>
            {m.actions && m.actions.length > 0 && (
              <div className="assistant__plan">
                <ul>
                  {m.actions.map((a, j) => {
                    const Icon = ICONS[a.type];
                    return (
                      <li key={j}>
                        <Icon size={14} aria-hidden="true" /> {describe(a)}
                      </li>
                    );
                  })}
                </ul>
                {m.applied ? (
                  <p className="assistant__done">Applied. Bravo!</p>
                ) : (
                  <button type="button" className="button button--primary button--small" onClick={() => apply(i)}>
                    Apply
                    {(() => {
                      const writes = m.actions.filter((a) => a.type !== "theme").length;
                      return writes ? ` · ${writes * creditsPerRewrite} credits` : "";
                    })()}
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
        {thinking && (
          <li className="assistant__msg assistant__msg--ai assistant__msg--thinking">
            <LoaderCircle size={14} className="spin" aria-hidden="true" /> Thinking…
          </li>
        )}
      </ol>

      {messages.length === 1 && (
        <div className="assistant__suggest" role="group" aria-label="Ideas">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="quick-chip" onClick={() => void send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="assistant__form"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <textarea
          ref={input}
          className="assistant__input"
          name="message"
          rows={2}
          maxLength={1000}
          autoComplete="off"
          aria-label="What should change?"
          placeholder="For example, add a slide comparing him with Messi…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button type="submit" className="send-button" aria-label="Send" disabled={thinking || !draft.trim()}>
          <ArrowUp size={18} aria-hidden="true" />
        </button>
      </form>
    </aside>
  );
}

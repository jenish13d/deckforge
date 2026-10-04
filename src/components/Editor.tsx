"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { CardEditForm } from "@/components/CardEditForm";
import { CardPlaceholder, CardView } from "@/components/CardView";
import { DownloadMenu } from "@/components/DownloadMenu";
import { Presenter } from "@/components/Presenter";
import { emptyCard, type CardContent } from "@/lib/cards";
import { ApiError, api } from "@/lib/client";
import type { CardView as CardData, DeckView } from "@/lib/decks";
import { MODES, MODE_IDS, isModeId, type ModeId } from "@/lib/plans";
import { THEMES, isThemeId } from "@/lib/themes";
import { SITE } from "@/lib/site";

// How many times a card waits out the AI's per-minute limit before giving up.
const MAX_BUSY_RETRIES = 8;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  const copy = { ...record };
  delete copy[key];
  return copy;
}

export function Editor({
  initial,
  initialCredits,
  allowedModes,
  parallel = 3,
  photosEnabled = false,
}: {
  initial: DeckView;
  initialCredits: number;
  allowedModes: ModeId[];
  /** Cards written at once (1 on the free Gemini tier, which allows few requests per minute). */
  parallel?: number;
  photosEnabled?: boolean;
}) {
  const [deck, setDeck] = useState(initial);
  const [credits, setCredits] = useState(initialCredits);
  const [mode, setMode] = useState<ModeId>(allowedModes.includes(initial.mode) ? initial.mode : allowedModes[0]);
  // Set when the server says we're out of credits, so pending cards stop retrying.
  const [outOfCredits, setOutOfCredits] = useState(false);
  // Set when the AI's daily limit is reached, for the same reason.
  const [dailyLimit, setDailyLimit] = useState(false);
  // "Waiting for the AI…" notes for cards that are waiting out a rate limit.
  const [waiting, setWaiting] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [presenting, setPresenting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tick, setTick] = useState(0);
  const inFlight = useRef(new Set<string>());

  const replaceCard = (card: CardData) =>
    setDeck((d) => ({ ...d, cards: d.cards.map((c) => (c.id === card.id ? card : c)) }));

  const generate = useCallback(
    async (cardId: string, instructions?: string, cardMode?: ModeId) => {
      if (inFlight.current.has(cardId)) return;
      inFlight.current.add(cardId);
      setBusy((b) => ({ ...b, [cardId]: true }));
      setCardErrors((errs) => without(errs, cardId));
      try {
        for (let attempt = 0; ; attempt++) {
          try {
            const result = await api<{ card: CardData; credits: number }>(
              `/api/decks/${deck.id}/cards/${cardId}/generate`,
              { body: { instructions, mode: cardMode } },
            );
            replaceCard(result.card);
            setCredits(result.credits);
            break;
          } catch (e) {
            // The AI is rate limited for a moment: wait as long as it asks, then try again.
            const busy = e instanceof ApiError && e.status === 429 && typeof e.data.retryAfter === "number";
            if (!busy || e.data.daily || attempt >= MAX_BUSY_RETRIES) throw e;
            const seconds = Math.min(Math.max(e.data.retryAfter as number, 5), 60);
            setWaiting((w) => ({ ...w, [cardId]: `Waiting for the AI (free plan limit)… retrying in ${seconds}s` }));
            await sleep(seconds * 1000);
            setWaiting((w) => without(w, cardId));
          }
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 402) setOutOfCredits(true);
        if (e instanceof ApiError && e.status === 429 && e.data.daily) setDailyLimit(true);
        setCardErrors((errs) => ({ ...errs, [cardId]: e instanceof Error ? e.message : String(e) }));
        setDeck((d) => ({
          ...d,
          cards: d.cards.map((c) => (c.id === cardId && !c.content ? { ...c, status: "failed" } : c)),
        }));
      } finally {
        inFlight.current.delete(cardId);
        setBusy((b) => without(b, cardId));
        setWaiting((w) => without(w, cardId));
        setTick((t) => t + 1);
      }
    },
    [deck.id],
  );

  // Write pending cards a few at a time; resumes after a page reload too.
  useEffect(() => {
    if (outOfCredits || dailyLimit) return;
    const free = parallel - inFlight.current.size;
    deck.cards
      .filter((c) => c.status === "pending" && !inFlight.current.has(c.id))
      .slice(0, Math.max(free, 0))
      .forEach((c) => void generate(c.id));
  }, [deck.cards, outOfCredits, dailyLimit, parallel, generate, tick]);

  async function run(action: () => Promise<void>) {
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDeck(await api<DeckView>(`/api/decks/${deck.id}`)); // resync after a failed change
    }
  }

  const patchDeck = (body: Record<string, unknown>) =>
    run(async () => {
      await api(`/api/decks/${deck.id}`, { method: "PATCH", body });
    });

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= deck.cards.length) return;
    const cards = [...deck.cards];
    [cards[index], cards[target]] = [cards[target], cards[index]];
    setDeck({ ...deck, cards });
    void run(async () => {
      // The response carries the new positions, which "add card" relies on.
      setDeck(await api<DeckView>(`/api/decks/${deck.id}`, { method: "PATCH", body: { order: cards.map((c) => c.id) } }));
    });
  }

  function remove(card: CardData) {
    if (!window.confirm(`Delete "${card.content?.title ?? card.brief.title}"?`)) return;
    setDeck((d) => ({ ...d, cards: d.cards.filter((c) => c.id !== card.id) }));
    void run(async () => {
      await api(`/api/decks/${deck.id}/cards/${card.id}`, { method: "DELETE" });
    });
  }

  function addAfter(position: number) {
    const title = window.prompt("What should the new card be about?");
    if (!title?.trim()) return;
    void run(async () => {
      await api(`/api/decks/${deck.id}/cards`, { body: { afterPosition: position, title } });
      setDeck(await api<DeckView>(`/api/decks/${deck.id}`));
    });
  }

  function regenerate(card: CardData) {
    const instructions = window.prompt("Anything to change? (optional, e.g. 'shorter', 'use a timeline')", "");
    if (instructions === null) return;
    setOutOfCredits(false);
    void generate(card.id, instructions.trim() || undefined, mode);
  }

  async function saveCard(cardId: string, content: CardContent) {
    try {
      replaceCard(await api<CardData>(`/api/decks/${deck.id}/cards/${cardId}`, { method: "PATCH", body: { content } }));
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/d/${deck.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", `${window.location.origin}/d/${deck.id}`);
    }
  }

  const readyCards = deck.cards.flatMap((c) => (c.content ? [c.content] : []));
  const writing = deck.cards.filter((c) => c.status === "pending").length;

  return (
    <>
      <header className="toolbar">
        <Link href="/" className="toolbar__brand">{SITE.name}</Link>
        <input
          className="input toolbar__title"
          aria-label="Deck title"
          defaultValue={deck.title}
          maxLength={120}
          onBlur={(e) => {
            const title = e.target.value.trim();
            if (title && title !== deck.title) {
              setDeck((d) => ({ ...d, title }));
              void patchDeck({ title });
            }
          }}
        />
        <select
          className="input"
          aria-label="Theme"
          value={deck.theme}
          onChange={(e) => {
            if (!isThemeId(e.target.value)) return;
            setDeck((d) => ({ ...d, theme: e.target.value }));
            void patchDeck({ theme: e.target.value });
          }}
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          className="input"
          aria-label="Quality for regenerated cards"
          title="Quality used when you regenerate a card"
          value={mode}
          onChange={(e) => isModeId(e.target.value) && setMode(e.target.value)}
        >
          {MODE_IDS.map((id) => (
            <option key={id} value={id} disabled={!allowedModes.includes(id)}>
              {MODES[id].icon} {MODES[id].label} ({MODES[id].creditsPerCard}/card){allowedModes.includes(id) ? "" : " · not available"}
            </option>
          ))}
        </select>
        <Link href="/account" className="credits-pill" title="Credits left this month">{credits} credits</Link>
        <button type="button" className="button" onClick={share}>{copied ? "Link copied" : "Share"}</button>
        <Link className="button" href={`/d/${deck.id}`} target="_blank">View</Link>
        <DownloadMenu cards={readyCards} theme={deck.theme} title={deck.title} />
        <button
          type="button"
          className="button button--primary"
          onClick={() => setPresenting(true)}
          disabled={readyCards.length === 0}
        >
          Present
        </button>
      </header>

      <main className="page">
        {writing > 0 && <p className="status" role="status">Writing {writing} card{writing === 1 ? "" : "s"}…</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {outOfCredits && (
          <p className="banner" role="alert">
            You&apos;re out of credits, so some cards weren&apos;t written. <Link href="/account#upgrade">Upgrade to Pro</Link>{" "}
            or edit those cards by hand.
          </p>
        )}

        {dailyLimit && (
          <p className="banner" role="alert">
            Today&apos;s free AI limit has been reached, so some cards weren&apos;t written. Try again tomorrow, or
            edit those cards by hand.
          </p>
        )}

        <div className={`deck theme-${deck.theme}`}>
          {deck.cards.map((card, i) => (
            <section key={card.id} className="editor-card">
              <div className="editor-card__tools">
                <span className="editor-card__number">{i + 1}</span>
                <button type="button" className="icon-button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button type="button" className="icon-button" onClick={() => move(i, 1)} disabled={i === deck.cards.length - 1} aria-label="Move down">↓</button>
                <button type="button" className="button button--small" onClick={() => setEditing(card.id)} disabled={busy[card.id]}>Edit</button>
                <button type="button" className="button button--small" onClick={() => regenerate(card)} disabled={busy[card.id]}>
                  {busy[card.id] ? "Writing…" : "Regenerate"}
                </button>
                <button type="button" className="button button--small button--danger" onClick={() => remove(card)} disabled={busy[card.id]}>Delete</button>
              </div>

              {editing === card.id ? (
                <CardEditForm
                  initial={card.content ?? emptyCard(card.brief.title)}
                  onSave={(content) => saveCard(card.id, content)}
                  onCancel={() => setEditing(null)}
                  photosEnabled={photosEnabled}
                />
              ) : card.content ? (
                <div className={busy[card.id] ? "is-busy" : undefined}>
                  <CardView content={card.content} />
                </div>
              ) : (
                <CardPlaceholder
                  title={card.brief.title}
                  failed={card.status === "failed" && !busy[card.id]}
                  note={waiting[card.id]}
                />
              )}
              {card.content && waiting[card.id] && <p className="status">{waiting[card.id]}</p>}
              {cardErrors[card.id] && <p className="error">{cardErrors[card.id]}</p>}

              <button type="button" className="add-card" onClick={() => addAfter(card.position)}>+ Add card</button>
            </section>
          ))}
          {deck.cards.length === 0 && (
            <button type="button" className="add-card" onClick={() => addAfter(-1)}>+ Add card</button>
          )}
        </div>
      </main>

      {presenting && <Presenter cards={readyCards} theme={deck.theme} onClose={() => setPresenting(false)} />}
    </>
  );
}

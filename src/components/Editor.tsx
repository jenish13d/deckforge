"use client";

import { ArrowDown, ArrowUp, CopyPlus, Palette, Settings2, Sparkles, Ellipsis, Eye, LoaderCircle, Lock, PartyPopper, Pencil, Play, Plus, Share2, Trash2, WandSparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CardEditForm } from "@/components/CardEditForm";
import { CardPlaceholder, CardView } from "@/components/CardView";
import { BrandMark } from "@/components/BrandMark";
import { DownloadMenu } from "@/components/DownloadMenu";
import { AssistantPanel } from "@/components/editor/AssistantPanel";
import { DeckSettingsDialog } from "@/components/editor/DeckSettingsDialog";
import { SlideRail } from "@/components/editor/SlideRail";
import { ThemeDialog } from "@/components/editor/ThemeDialog";
import { ModePicker } from "@/components/ModePicker";
import { SourcesList } from "@/components/SourcesList";
import { Presenter } from "@/components/Presenter";
import { ShareDialog } from "@/components/share/ShareDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Menu } from "@/components/ui/Menu";
import { PromptDialog } from "@/components/ui/PromptDialog";
import { useToast } from "@/components/ui/Toast";
import { emptyCard, plainTitle, type CardContent } from "@/lib/cards";
import { ApiError, api } from "@/lib/client";
import type { CardView as CardData, DeckView } from "@/lib/decks";
import { MODES, type ModeId } from "@/lib/plans";
import { deckSlides, type DeckLook } from "@/lib/slides";
import { THEMES, isThemeId, type ThemeId } from "@/lib/themes";

// How many times a card waits out the AI's per-minute limit before giving up.
const MAX_BUSY_RETRIES = 8;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Dialog =
  | { kind: "add"; position: number }
  | { kind: "regenerate"; card: CardData }
  | { kind: "delete"; card: CardData }
  | { kind: "theme" }
  | { kind: "settings" };

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
  canRemoveBadge = false,
}: {
  initial: DeckView;
  initialCredits: number;
  allowedModes: ModeId[];
  /** Cards written at once (1 on the free Gemini tier, which allows few requests per minute). */
  parallel?: number;
  photosEnabled?: boolean;
  /** Paid plans can take the "Made with" badge off. */
  canRemoveBadge?: boolean;
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
  const [sharing, setSharing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [assistant, setAssistant] = useState(false);
  const [toast, showToast] = useToast();
  const router = useRouter();
  const [tick, setTick] = useState(0);
  // Celebrate once a freshly generated deck has every card written.
  const [startedWriting] = useState(() => initial.cards.some((c) => c.status === "pending"));
  const [bravoClosed, setBravoClosed] = useState(false);
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
    setDeck((d) => ({ ...d, cards: d.cards.filter((c) => c.id !== card.id) }));
    void run(async () => {
      await api(`/api/decks/${deck.id}/cards/${card.id}`, { method: "DELETE" });
    });
  }

  function addAfter(position: number, title: string) {
    void run(async () => {
      await api(`/api/decks/${deck.id}/cards`, { body: { afterPosition: position, title } });
      setDeck(await api<DeckView>(`/api/decks/${deck.id}`));
    });
  }

  function regenerate(card: CardData, instructions: string) {
    setOutOfCredits(false);
    void generate(card.id, instructions || undefined, mode);
  }

  /** Carries out the changes the assistant proposed and the user approved. */
  function applyAssist(actions: { type: "add" | "rewrite" | "theme"; slide: number; title: string; instruction: string; theme: string }[]) {
    for (const a of actions) {
      if (a.type === "theme" && isThemeId(a.theme)) changeTheme(a.theme);
      if (a.type === "rewrite") {
        const card = deck.cards[a.slide - 1];
        if (card) {
          setOutOfCredits(false);
          void generate(card.id, a.instruction, mode);
        }
      }
    }
    // New slides go in last, from the end backwards, so earlier positions stay right.
    const adds = actions.filter((a) => a.type === "add").sort((x, y) => y.slide - x.slide);
    for (const a of adds) addAfter(a.slide === 0 ? -1 : (deck.cards[a.slide - 1]?.position ?? deck.cards.length - 1), a.title);
  }

  function changeLook(patch: Partial<DeckLook>) {
    setDeck((d) => ({ ...d, look: { ...d.look, ...patch } }));
    void patchDeck(patch);
  }

  function changeTheme(theme: ThemeId) {
    setDeck((d) => ({ ...d, theme }));
    void patchDeck({ theme });
  }

  async function saveCard(cardId: string, content: CardContent) {
    try {
      replaceCard(await api<CardData>(`/api/decks/${deck.id}/cards/${cardId}`, { method: "PATCH", body: { content } }));
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function duplicateDeck() {
    try {
      const { id } = await api<{ id: string }>(`/api/decks/${deck.id}/duplicate`, { body: {} });
      showToast("Copy created. Opening it…");
      router.push(`/d/${id}/edit`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e));
    }
  }

  const readyCards = deck.cards.flatMap((c) => (c.content ? [c.content] : []));
  // What viewers, the slideshow and downloads get: credits moved and the closing slide added as set.
  const slides = deckSlides(readyCards, deck.look);
  const extraSlides = slides.slice(readyCards.length);
  const writing = deck.cards.filter((c) => c.status === "pending").length;
  const nowWriting = deck.cards.findIndex((c) => c.status === "pending" && busy[c.id]);
  const themeName = THEMES.find((t) => t.id === deck.theme)?.name ?? "Theme";
  const bravo = startedWriting && !bravoClosed && deck.cards.length > 0 && deck.cards.every((c) => c.status === "ready");

  return (
    <>
      <header className="toolbar studio-bar">
        <Link href="/decks" className="studio-bar__home" aria-label="My decks">
          <BrandMark size={28} />
        </Link>
        <input
          className="studio-bar__title"
          aria-label="Deck title"
          name="title"
          autoComplete="off"
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
        <div className="studio-bar__actions">
          <button
            type="button"
            className={`button studio-bar__ask${assistant ? " is-on" : ""}`}
            aria-label="Ask Slidezza"
            aria-expanded={assistant}
            onClick={() => setAssistant((a) => !a)}
          >
            <Sparkles size={16} aria-hidden="true" /> <span className="button__label">Ask AI</span>
          </button>
          <button type="button" className="button studio-bar__theme" onClick={() => setDialog({ kind: "theme" })} aria-label={`Theme: ${themeName}`}>
            <span className={`studio-bar__swatch theme-${deck.theme}`} aria-hidden="true" />
            <span className="button__label">{themeName}</span>
          </button>
          <Link href="/account" className="credits-pill studio-bar__credits" title="Credits left this month">{credits} credits</Link>
          <button type="button" className="button" onClick={() => setSharing(true)} aria-label="Share">
            {deck.shared ? <Share2 size={16} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
            <span className="button__label">Share</span>
          </button>
          <DownloadMenu cards={slides} theme={deck.theme} title={deck.title} badge={deck.look.badge} />
          <button
            type="button"
            className="button button--primary studio-bar__present"
            onClick={() => setPresenting(true)}
            disabled={readyCards.length === 0}
            aria-label="Present"
          >
            <Play size={16} aria-hidden="true" /> <span className="button__label">Present</span>
          </button>
          <Menu label={{ text: "More options", content: <Ellipsis size={18} aria-hidden="true" /> }} buttonClassName="button button--icon">
            {(close) => (
              <>
                <button type="button" className="menu__item" onClick={() => { close(); setDialog({ kind: "theme" }); }}>
                  <Palette size={16} aria-hidden="true" /> Change theme
                </button>
                <button type="button" className="menu__item" onClick={() => { close(); setDialog({ kind: "settings" }); }}>
                  <Settings2 size={16} aria-hidden="true" /> Deck settings
                </button>
                <Link className="menu__item" href={`/d/${deck.id}`} target="_blank" onClick={close}>
                  <Eye size={16} aria-hidden="true" /> View as audience
                </Link>
                <button type="button" className="menu__item" onClick={() => { close(); void duplicateDeck(); }}>
                  <CopyPlus size={16} aria-hidden="true" /> Duplicate deck
                </button>
                <button type="button" className="menu__item menu__item--danger" onClick={() => { close(); setConfirmDelete(true); }}>
                  <Trash2 size={16} aria-hidden="true" /> Delete deck
                </button>
              </>
            )}
          </Menu>
        </div>
      </header>

      <div className="studio">
      <SlideRail cards={deck.cards} theme={deck.theme} />
      <main id="main" className="page studio__canvas">
        <h1 className="sr-only">{deck.title}</h1>
        {writing > 0 && (
          <div className="writing writing--float" role="status">
            <p className="writing__text">
              <LoaderCircle size={16} className="spin" aria-hidden="true" />
              <span>
                {nowWriting >= 0 ? (
                  <>
                    Writing slide {nowWriting + 1}: <strong>{plainTitle(deck.cards[nowWriting].brief.title)}</strong>
                  </>
                ) : (
                  `Writing card ${deck.cards.length - writing + 1} of ${deck.cards.length}…`
                )}
              </span>
            </p>
            <p className="writing__sub">
              {deck.cards.length - writing} of {deck.cards.length} ready · facts checked against the sources
            </p>
            <div className="progress" aria-hidden="true">
              <span style={{ transform: `scaleX(${(deck.cards.length - writing) / deck.cards.length})` }} />
            </div>
          </div>
        )}
        {bravo && (
          <div className="bravo" role="status">
            <span className="bravo__confetti" aria-hidden="true">
              {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ "--n": i } as React.CSSProperties} />)}
            </span>
            <PartyPopper size={22} className="bravo__icon" aria-hidden="true" />
            <span className="bravo__text"><strong>Bravo!</strong> Your deck is ready. Present it, share the link or download it.</span>
            <button type="button" className="button button--primary bravo__present" onClick={() => setPresenting(true)}>
              <Play size={16} aria-hidden="true" /> Present
            </button>
            <button type="button" className="icon-button" aria-label="Close" onClick={() => setBravoClosed(true)}><X size={16} aria-hidden="true" /></button>
          </div>
        )}
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
            <section key={card.id} id={`card-${card.id}`} className="editor-card" aria-label={`Slide ${i + 1}`}>
              <div className="editor-card__tools">
                <span className="editor-card__number">{i + 1}</span>
                <div className="editor-card__actions">
                  <button type="button" className="tool" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" title="Move up">
                    <ArrowUp size={16} aria-hidden="true" />
                  </button>
                  <button type="button" className="tool" onClick={() => move(i, 1)} disabled={i === deck.cards.length - 1} aria-label="Move down" title="Move down">
                    <ArrowDown size={16} aria-hidden="true" />
                  </button>
                  <button type="button" className="tool tool--label" onClick={() => setEditing(card.id)} disabled={busy[card.id]}>
                    <Pencil size={15} aria-hidden="true" /> <span>Edit</span>
                  </button>
                  <button type="button" className="tool tool--label" onClick={() => setDialog({ kind: "regenerate", card })} disabled={busy[card.id]}>
                    <WandSparkles size={15} aria-hidden="true" /> <span>{busy[card.id] ? "Writing…" : "Rewrite"}</span>
                  </button>
                  <button type="button" className="tool tool--danger" onClick={() => setDialog({ kind: "delete", card })} disabled={busy[card.id]} aria-label="Delete slide" title="Delete slide">
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
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
                  <CardView content={deck.look.credits === "end" ? slides[readyCards.indexOf(card.content)] ?? card.content : card.content} index={i} badge={deck.look.badge} />
                </div>
              ) : (
                <CardPlaceholder
                  title={card.brief.title}
                  failed={card.status === "failed" && !busy[card.id]}
                  note={waiting[card.id]}
                  active={Boolean(busy[card.id])}
                />
              )}
              {card.content && waiting[card.id] && <p className="status" role="status">{waiting[card.id]}</p>}
              {cardErrors[card.id] && <p className="error" role="alert">{cardErrors[card.id]}</p>}

              <div className="add-card">
                <button type="button" className="add-card__button" onClick={() => setDialog({ kind: "add", position: card.position })}>
                  <Plus size={15} aria-hidden="true" /> Add slide
                </button>
              </div>
            </section>
          ))}
          {deck.cards.length === 0 && (
            <div className="add-card">
              <button type="button" className="add-card__button" onClick={() => setDialog({ kind: "add", position: -1 })}>
                <Plus size={15} aria-hidden="true" /> Add slide
              </button>
            </div>
          )}
        </div>
        {extraSlides.length > 0 && (
          <section className="auto-slides" aria-label="Slides added automatically">
            <p className="auto-slides__label">
              <Settings2 size={14} aria-hidden="true" /> Added automatically ·{" "}
              <button type="button" className="link-button" onClick={() => setDialog({ kind: "settings" })}>Deck settings</button>
            </p>
            <div className={`deck theme-${deck.theme}`}>
              {extraSlides.map((content, i) => (
                <CardView key={i} content={content} index={readyCards.length + i} badge={deck.look.badge} />
              ))}
            </div>
          </section>
        )}
        <SourcesList sources={deck.sources} />
      </main>
      </div>

      {assistant && (
        <AssistantPanel
          deckId={deck.id}
          creditsPerRewrite={MODES[mode].creditsPerCard}
          onApply={applyAssist}
          onClose={() => setAssistant(false)}
        />
      )}
      {dialog?.kind === "settings" && (
        <DeckSettingsDialog look={deck.look} canRemoveBadge={canRemoveBadge} onChange={changeLook} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "theme" && (
        <ThemeDialog
          value={deck.theme}
          sample={readyCards[0] ?? emptyCard(deck.title)}
          onChange={changeTheme}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "add" && (
        <PromptDialog
          title="Add a slide"
          label="What should the new slide be about?"
          placeholder="For example, a timeline of the main events…"
          confirmLabel="Add slide"
          required
          onConfirm={(title) => addAfter(dialog.position, title)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "regenerate" && (
        <PromptDialog
          title="Rewrite this slide"
          label="Anything to change? (optional)"
          placeholder="For example, shorter, or use a timeline…"
          confirmLabel={`Rewrite · ${MODES[mode].creditsPerCard} credit${MODES[mode].creditsPerCard === 1 ? "" : "s"}`}
          onConfirm={(instructions) => regenerate(dialog.card, instructions)}
          onClose={() => setDialog(null)}
        >
          <ModePicker value={mode} onChange={setMode} allowed={allowedModes} />
          <p className="muted small">You have {credits} credits left.</p>
        </PromptDialog>
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Delete this slide?"
          message={`“${plainTitle(dialog.card.content?.title ?? dialog.card.brief.title)}” will be removed from the deck.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => remove(dialog.card)}
          onClose={() => setDialog(null)}
        />
      )}

      {presenting && <Presenter cards={slides} theme={deck.theme} badge={deck.look.badge} onClose={() => setPresenting(false)} />}
      {sharing && (
        <ShareDialog
          deckId={deck.id}
          title={deck.title}
          shared={deck.shared}
          canManage
          onClose={() => setSharing(false)}
          onSharedChange={(shared) => setDeck((d) => ({ ...d, shared }))}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete this deck?"
          message={`“${deck.title}” will be deleted for good, and its share link will stop working.`}
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await api(`/api/decks/${deck.id}`, { method: "DELETE" });
            router.push("/decks");
            router.refresh();
          }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
      {toast}
    </>
  );
}

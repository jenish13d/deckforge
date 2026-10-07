"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { imageSrc, showsImage, type CardContent } from "@/lib/cards";
import { CardView } from "./CardView";

const SWIPE_PX = 50;
const IDLE_MS = 2200;

/**
 * Full-screen slideshow. Arrow keys, space, swipe, or tap the right/left side to move;
 * Esc to leave. Slides glide in from the direction you're going, and the controls
 * fade away while you present.
 */
export function Presenter({
  cards,
  theme,
  badge = false,
  onClose,
}: {
  cards: CardContent[];
  theme: string;
  /** "Made with Slidezza" on each slide. */
  badge?: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [idle, setIdle] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const last = cards.length - 1;

  const go = useCallback(
    (to: number) => {
      const target = Math.max(0, Math.min(to, last));
      if (target === index) return;
      setDirection(target > index ? 1 : -1);
      setIndex(target);
    },
    [index, last],
  );
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  const wake = useCallback(() => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
  }, []);

  useEffect(() => {
    // Keyboard and screen-reader focus moves into the slideshow, and back when it closes.
    const opener = document.activeElement as HTMLElement | null;
    root.current?.focus();
    root.current?.requestFullscreen?.().catch(() => {});
    const onFullscreenExit = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener("fullscreenchange", onFullscreenExit);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenExit);
      clearTimeout(idleTimer.current);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      opener?.focus?.();
    };
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      wake();
      // Space on a focused button would also click it; handle it here only.
      if (e.key === " ") e.preventDefault();
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") next();
      else if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(last);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go, last, onClose, wake]);

  // Load the next slide's photo ahead of time so it appears instantly.
  useEffect(() => {
    const upcoming = cards[index + 1];
    if (upcoming && showsImage(upcoming)) new Image().src = imageSrc(upcoming.image.url);
  }, [cards, index]);

  if (cards.length === 0) return null;

  return (
    <div
      ref={root}
      className={`presenter theme-${theme}${idle ? " is-idle" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Presentation"
      tabIndex={-1}
      onFocus={wake}
      onMouseMove={wake}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        wake();
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (dx < -SWIPE_PX) next();
        else if (dx > SWIPE_PX) prev();
      }}
    >
      <div className="presenter__progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${(index + 1) / cards.length})` }} />
      </div>
      <div
        className="presenter__stage"
        onClick={(e) => {
          // Tap the left third to go back, anywhere else to go forward.
          const { left, width } = e.currentTarget.getBoundingClientRect();
          if (e.clientX - left < width / 3) prev();
          else next();
        }}
      >
        <div key={index} className={`presenter__slide presenter__slide--${direction === 1 ? "next" : "prev"}`}>
          <CardView content={cards[index]} index={index} badge={badge} />
        </div>
      </div>
      <p className="presenter__hint">Tip: turn your phone sideways for bigger slides</p>
      <div className="presenter__bar">
        <button type="button" onClick={prev} disabled={index === 0} aria-label="Previous slide">
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <span className="presenter__count" aria-live="polite">{index + 1} / {cards.length}</span>
        <button type="button" onClick={next} disabled={index === last} aria-label="Next slide">
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        <button type="button" className="presenter__exit" onClick={onClose} aria-label="Exit presentation">
          <X size={18} aria-hidden="true" /> Exit
        </button>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CardContent } from "@/lib/cards";
import { CardView } from "./CardView";

/** Full-screen slideshow. Arrow keys / space / click to move, Esc to leave. */
export function Presenter({
  cards,
  theme,
  onClose,
}: {
  cards: CardContent[];
  theme: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const last = cards.length - 1;

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, last)), [last]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    root.current?.requestFullscreen?.().catch(() => {});
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") next();
      else if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
      else if (e.key === "Escape") onClose();
    };
    const onFullscreenExit = () => {
      if (!document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreenExit);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreenExit);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [next, prev, onClose]);

  if (cards.length === 0) return null;

  return (
    <div ref={root} className={`presenter theme-${theme}`} role="dialog" aria-label="Presentation">
      <div className="presenter__stage" onClick={next}>
        <CardView content={cards[index]} />
      </div>
      <div className="presenter__bar">
        <button type="button" onClick={prev} disabled={index === 0} aria-label="Previous card">←</button>
        <span>{index + 1} / {cards.length}</span>
        <button type="button" onClick={next} disabled={index === last} aria-label="Next card">→</button>
        <button type="button" onClick={onClose}>Exit</button>
      </div>
    </div>
  );
}

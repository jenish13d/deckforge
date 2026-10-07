"use client";

import { useEffect, useState } from "react";

import { CardView } from "@/components/CardView";
import { plainTitle } from "@/lib/cards";
import type { CardView as CardData } from "@/lib/decks";

/** Slide thumbnails beside the editor (laptops): shows where you are and jumps to a slide. */
export function SlideRail({ cards, theme }: { cards: CardData[]; theme: string }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id.replace(/^card-/, ""));
      },
      { rootMargin: "-30% 0px -40% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    for (const card of cards) {
      const el = document.getElementById(`card-${card.id}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [cards]);

  function jump(id: string) {
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
    setActive(id);
  }

  return (
    <nav className="slide-rail" aria-label="Slides">
      <ol className={`slide-rail__list theme-${theme}`}>
        {cards.map((card, i) => {
          const title = plainTitle(card.content?.title ?? card.brief.title);
          return (
            <li key={card.id}>
              <button
                type="button"
                className={`slide-rail__item${active === card.id ? " is-active" : ""}`}
                aria-current={active === card.id ? "true" : undefined}
                aria-label={`Slide ${i + 1}: ${title}`}
                onClick={() => jump(card.id)}
              >
                <span className="slide-rail__number">{i + 1}</span>
                <span className="slide-rail__thumb mini-card" aria-hidden="true" inert>
                  {card.content ? <CardView content={card.content} index={i} preview /> : <span className="slide-rail__empty">{title}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

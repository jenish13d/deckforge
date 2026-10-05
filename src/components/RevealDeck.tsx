"use client";

import { useEffect, useRef } from "react";

/** Slides rise into place as they scroll into view (viewer page). Without JS or with reduced motion they simply show. */
export function RevealDeck({ className, children }: { className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const deck = ref.current;
    if (!deck || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = Array.from(deck.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.in = "";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    deck.dataset.reveal = "";
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

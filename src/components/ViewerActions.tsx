"use client";

import { useState } from "react";

import type { CardContent } from "@/lib/cards";
import { Presenter } from "./Presenter";

export function ViewerActions({ cards, theme }: { cards: CardContent[]; theme: string }) {
  const [presenting, setPresenting] = useState(false);
  return (
    <>
      <button type="button" className="button" onClick={() => window.print()}>Download PDF</button>
      <button type="button" className="button button--primary" onClick={() => setPresenting(true)} disabled={cards.length === 0}>
        Present
      </button>
      {presenting && <Presenter cards={cards} theme={theme} onClose={() => setPresenting(false)} />}
    </>
  );
}

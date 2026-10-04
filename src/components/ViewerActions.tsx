"use client";

import { useState } from "react";

import type { CardContent } from "@/lib/cards";
import { DownloadMenu } from "./DownloadMenu";
import { Presenter } from "./Presenter";

export function ViewerActions({ cards, theme, title }: { cards: CardContent[]; theme: string; title: string }) {
  const [presenting, setPresenting] = useState(false);
  return (
    <>
      <DownloadMenu cards={cards} theme={theme} title={title} />
      <button type="button" className="button button--primary" onClick={() => setPresenting(true)} disabled={cards.length === 0}>
        Present
      </button>
      {presenting && <Presenter cards={cards} theme={theme} onClose={() => setPresenting(false)} />}
    </>
  );
}

"use client";

import type { CardContent } from "@/lib/cards";
import { PdfButton } from "./PdfButton";
import { PptxButton } from "./PptxButton";

/** "Download" dropdown with PDF and PowerPoint. */
export function DownloadMenu({ cards, theme, title }: { cards: CardContent[]; theme: string; title: string }) {
  return (
    <details className="menu">
      <summary className="button">Download ▾</summary>
      <div className="menu__panel" role="menu">
        <PdfButton cards={cards} theme={theme} title={title} className="menu__item" />
        <PptxButton cards={cards} theme={theme} title={title} className="menu__item" />
      </div>
    </details>
  );
}

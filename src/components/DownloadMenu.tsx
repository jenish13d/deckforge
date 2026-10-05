"use client";

import { useRef, useState } from "react";

import type { CardContent } from "@/lib/cards";
import { PdfButton } from "./PdfButton";
import { PptxButton } from "./PptxButton";
import { useInViewport } from "./ui/useInViewport";

/** "Download" dropdown with PDF and PowerPoint. */
export function DownloadMenu({ cards, theme, title }: { cards: CardContent[]; theme: string; title: string }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const shift = useInViewport(panel, open);
  return (
    <details className="menu" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="button">Download <span aria-hidden="true">▾</span></summary>
      <div ref={panel} className="menu__panel" style={shift ? { translate: `${shift}px 0` } : undefined}>
        <PdfButton cards={cards} theme={theme} title={title} className="menu__item" />
        <PptxButton cards={cards} theme={theme} title={title} className="menu__item" />
      </div>
    </details>
  );
}

"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import type { CardContent } from "@/lib/cards";
import { PdfButton } from "./PdfButton";
import { PptxButton } from "./PptxButton";
import { useInViewport } from "./ui/useInViewport";

/** "Download" dropdown with PDF and PowerPoint. */
export function DownloadMenu({
  cards,
  theme,
  title,
  badge = false,
  pptx = true,
}: {
  cards: CardContent[];
  theme: string;
  title: string;
  badge?: boolean;
  /** PowerPoint download is part of Pro and Max (the deck owner's plan). */
  pptx?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const shift = useInViewport(panel, open);
  return (
    <details className="menu" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="button" aria-label="Download">
        <Download size={16} aria-hidden="true" /> <span className="button__label">Download</span>
      </summary>
      <div ref={panel} className="menu__panel" style={shift ? { translate: `${shift}px 0` } : undefined}>
        <PdfButton cards={cards} theme={theme} title={title} badge={badge} className="menu__item" />
        {pptx ? (
          <PptxButton cards={cards} theme={theme} title={title} badge={badge} className="menu__item" />
        ) : (
          <Link href="/account#upgrade" className="menu__item menu__item--locked">
            PowerPoint (.pptx) <span className="badge">Pro</span>
          </Link>
        )}
      </div>
    </details>
  );
}

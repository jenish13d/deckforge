"use client";

import { useState } from "react";

import type { CardContent } from "@/lib/cards";

export function PptxButton({
  cards,
  theme,
  title,
  badge = false,
  className = "button",
}: {
  cards: CardContent[];
  theme: string;
  title: string;
  badge?: boolean;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  return (
    <button
      type="button"
      className={className}
      disabled={state === "working" || cards.length === 0}
      onClick={async () => {
        setState("working");
        try {
          const { downloadPptx } = await import("@/lib/pptx");
          await downloadPptx(cards, theme, title, { badge });
          setState("idle");
        } catch (error) {
          console.error("PowerPoint export failed", error);
          setState("error");
        }
      }}
    >
      {state === "working" ? "Creating PowerPoint…" : state === "error" ? "PowerPoint failed, try again" : "PowerPoint (.pptx)"}
    </button>
  );
}

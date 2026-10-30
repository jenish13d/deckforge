"use client";

import { useState } from "react";

import { Spinner3D } from "@/components/Spinner3D";
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
  const [done, setDone] = useState(0);
  return (
    <button
      type="button"
      className={className}
      disabled={state === "working" || cards.length === 0}
      onClick={async () => {
        setState("working");
        setDone(0);
        try {
          const { downloadPptx } = await import("@/lib/pptx");
          await downloadPptx(cards, theme, title, { badge, onProgress: setDone });
          setState("idle");
        } catch (error) {
          console.error("PowerPoint export failed", error);
          setState("error");
        }
      }}
    >
      {state === "working" && <Spinner3D size={16} />}
      {state === "working" ? (done < cards.length ? `Building slide ${done + 1} of ${cards.length}…` : "Saving the file…") : state === "error" ? "PowerPoint failed, try again" : "PowerPoint (.pptx)"}
    </button>
  );
}

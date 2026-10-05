"use client";

import { useEffect, useRef, useState } from "react";

import type { CardContent } from "@/lib/cards";
import { CardView } from "./CardView";

// Builds the PDF in the browser: each card is rendered at a fixed 1280×720, turned
// into an image and placed on its own 16:9 page. This looks the same in every browser,
// unlike printing (Firefox lays out the cards' scalable text differently when printing).

const WIDTH = 1280;
const HEIGHT = 720;

function fileName(title: string): string {
  const safe = title.replace(/[^\p{L}\p{N} _-]+/gu, "").trim().slice(0, 80);
  return `${safe || "deck"}.pdf`;
}

export function PdfButton({
  cards,
  theme,
  title,
  className = "button",
}: {
  cards: CardContent[];
  theme: string;
  title: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "rendering" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state !== "rendering" || !stage.current) return;
    let cancelled = false;

    (async () => {
      try {
        const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
        await document.fonts.ready;
        // Let photos load and settle how they fit their frames before taking pictures of the slides.
        const images = Array.from(stage.current!.querySelectorAll<HTMLImageElement>("img"));
        await Promise.all(images.map((img) => img.decode().catch(() => {})));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const pages = Array.from(stage.current!.querySelectorAll<HTMLElement>(".pdf-page"));
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [WIDTH, HEIGHT], hotfixes: ["px_scaling"] });

        for (let i = 0; i < pages.length; i++) {
          if (cancelled) return;
          const image = await toJpeg(pages[i], {
            width: WIDTH,
            height: HEIGHT,
            pixelRatio: 2,
            quality: 0.92,
            backgroundColor: "#ffffff",
            // Photos share one path (/api/image?src=…); without this every photo would reuse the first one.
            includeQueryParams: true,
            // A photo that fails to load becomes a blank area instead of stopping the export.
            imagePlaceholder: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
          });
          if (i > 0) pdf.addPage([WIDTH, HEIGHT], "landscape");
          pdf.addImage(image, "JPEG", 0, 0, WIDTH, HEIGHT);
          setProgress(i + 1);
        }
        pdf.save(fileName(title));
        setState("idle");
      } catch (error) {
        console.error("PDF export failed", error);
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state, title]);

  const busy = state === "rendering";
  return (
    <>
      <button
        type="button"
        className={className}
        disabled={busy || cards.length === 0}
        onClick={() => {
          setProgress(0);
          setState("rendering");
        }}
      >
        {busy ? `Creating PDF… ${progress}/${cards.length}` : state === "error" ? "PDF failed, try again" : "PDF"}
      </button>
      {busy && (
        <div ref={stage} className={`pdf-stage theme-${theme}`} aria-hidden="true">
          {cards.map((content, i) => (
            <div key={i} className="pdf-page">
              <CardView content={content} index={i} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

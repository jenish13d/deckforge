"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

const MARGIN = 12;

/**
 * How far to nudge an open dropdown sideways so it never runs off the edge of the
 * screen, whatever the phone or browser width. Apply it as `translate: <shift>px 0`.
 */
export function useInViewport(panel: RefObject<HTMLElement | null>, open: boolean): number {
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = panel.current?.getBoundingClientRect();
      if (!rect) return;
      const width = document.documentElement.clientWidth;
      // Measure where the panel would be without the current nudge.
      setShift((current) => {
        const left = rect.left - current;
        const right = rect.right - current;
        return left < MARGIN ? Math.round(MARGIN - left) : right > width - MARGIN ? Math.round(width - MARGIN - right) : 0;
      });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [panel, open]);
  return open ? shift : 0;
}

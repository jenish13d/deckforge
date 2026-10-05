"use client";

import { useEffect, useRef } from "react";

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

/**
 * Drives a 3D scene through CSS variables, so React never re-renders while it moves:
 * `--rx`/`--ry` follow the mouse (eased), `--p` is how far the element has been
 * scrolled through (0 to 1). Does nothing for visitors who prefer reduced motion.
 */
export function useStageMotion<T extends HTMLElement>({
  tilt = 0,
  scroll = "through",
  steps,
}: {
  tilt?: number;
  scroll?: "through" | "pinned";
  /** Progress points where each step after the first begins; sets `data-step` on the element. */
  steps?: number[];
}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let target = { x: 0, y: 0 };
    let now = { x: 0, y: 0 };

    const progress = () => {
      const box = el.getBoundingClientRect();
      const view = window.innerHeight;
      // "pinned": 0 when the section reaches the top, 1 when its end leaves the screen.
      // "through": 0 when the element sits where it loads, 1 once it has scrolled away.
      return scroll === "pinned" ? clamp(-box.top / Math.max(1, box.height - view)) : clamp(-box.top / Math.max(1, box.height));
    };

    const paint = () => {
      frame = 0;
      now = { x: now.x + (target.x - now.x) * 0.12, y: now.y + (target.y - now.y) * 0.12 };
      el.style.setProperty("--rx", `${(-now.y * tilt).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(now.x * tilt).toFixed(2)}deg`);
      const p = progress();
      el.style.setProperty("--p", p.toFixed(4));
      if (steps) el.dataset.step = String(steps.filter((start) => p >= start).length);
      if (Math.abs(target.x - now.x) > 0.001 || Math.abs(target.y - now.y) > 0.001) frame = requestAnimationFrame(paint);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      target = { x: clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1), y: clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1) };
      schedule();
    };

    paint();
    el.dataset.live = "";
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    if (tilt) window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [tilt, scroll, steps]);

  return ref;
}

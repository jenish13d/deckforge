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
  play,
}: {
  tilt?: number;
  scroll?: "through" | "pinned";
  /** Plays `--p` from 0 to 1 by itself while the element is on screen (then holds and loops) instead of following the scroll. */
  play?: { seconds: number; hold: number };
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

    // Autoplay: time since the element came into view, looping; paused while it's off screen.
    let shownAt = 0;
    let visible = false;
    const played = () => {
      if (!play || !visible) return 0;
      const t = ((performance.now() - shownAt) / 1000) % (play.seconds + play.hold);
      return clamp(t / play.seconds);
    };
    const progress = () => {
      if (play) return played();
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
      if (visible && play) frame = requestAnimationFrame(paint);
      else if (Math.abs(target.x - now.x) > 0.001 || Math.abs(target.y - now.y) > 0.001) frame = requestAnimationFrame(paint);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      target = { x: clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1), y: clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1) };
      schedule();
    };

    const observer = play
      ? new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting && !visible) {
            visible = true;
            shownAt = performance.now();
            schedule();
          } else if (!entry.isIntersecting) visible = false;
        }, { threshold: 0.35 })
      : null;
    observer?.observe(el);

    paint();
    el.dataset.live = play ? "play" : "";
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    if (tilt) window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [tilt, scroll, steps, play]);

  return ref;
}

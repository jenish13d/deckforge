"use client";

import { useRef } from "react";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Gives every `.tilt` element inside a gentle 3D lean toward the mouse and a soft
 * glare where it points. One listener for the whole group; touch and keyboard are unaffected.
 */
export function TiltZone({ className, children }: { className?: string; children: React.ReactNode }) {
  const last = useRef<HTMLElement | null>(null);

  function reset(el: HTMLElement | null) {
    el?.style.removeProperty("--tx");
    el?.style.removeProperty("--ty");
    el?.removeAttribute("data-tilting");
  }

  function onPointerMove(event: React.PointerEvent) {
    if (event.pointerType !== "mouse" || reduced()) return;
    const el = (event.target as HTMLElement).closest<HTMLElement>(".tilt");
    if (el !== last.current) reset(last.current);
    last.current = el;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    el.style.setProperty("--tx", (x * 2 - 1).toFixed(3));
    el.style.setProperty("--ty", (y * 2 - 1).toFixed(3));
    el.dataset.tilting = "";
  }

  return (
    <div
      className={className}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        reset(last.current);
        last.current = null;
      }}
    >
      {children}
    </div>
  );
}

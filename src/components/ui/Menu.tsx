"use client";

import { useEffect, useRef, useState } from "react";

import { useInViewport } from "./useInViewport";

/** Small dropdown menu; closes on outside click, Esc, or after choosing an item. */
export function Menu({
  label,
  buttonClassName = "button",
  children,
}: {
  /** Accessible name and content of the trigger button. */
  label: { text: string; content: React.ReactNode };
  buttonClassName?: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const shift = useInViewport(panel, open);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="dropdown" ref={root}>
      <button
        type="button"
        className={buttonClassName}
        aria-label={label.text}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {label.content}
      </button>
      {open && (
        <div ref={panel} className="menu__panel" role="menu" style={shift ? { translate: `${shift}px 0` } : undefined}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

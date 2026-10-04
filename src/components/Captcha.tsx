"use client";

import type {} from "altcha/types/react";
import { useEffect, useRef, useState } from "react";

/** "I'm not a robot" check. Calls onChange with the solution payload, or null when not (or no longer) verified. */
export function Captcha({ onChange }: { onChange: (payload: string | null) => void }) {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    import("altcha").then(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!ready || !el) return;
    const onState = (event: Event) => {
      const { state, payload } = (event as CustomEvent<{ state: string; payload?: string }>).detail;
      callback.current(state === "verified" && payload ? payload : null);
    };
    el.addEventListener("statechange", onState);
    return () => el.removeEventListener("statechange", onState);
  }, [ready]);

  return (
    <div className="captcha">
      <altcha-widget ref={ref} challenge="/api/captcha" type="checkbox" suppressHydrationWarning />
    </div>
  );
}

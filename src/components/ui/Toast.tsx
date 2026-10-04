"use client";

import { useCallback, useRef, useState } from "react";

/** A short message at the bottom of the screen ("Link copied"). Returns [element, show]. */
export function useToast(): [React.ReactNode, (message: string) => void] {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((text: string) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 2600);
  }, []);
  const node = message ? <p className="toast" role="status">{message}</p> : null;
  return [node, show];
}

"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/client";
import { Captcha } from "./Captcha";
import { SITE } from "@/lib/site";

const MOODS = [
  { value: 1, emoji: "😞", label: "Not good" },
  { value: 2, emoji: "😐", label: "Okay" },
  { value: 3, emoji: "🙂", label: "Good" },
  { value: 4, emoji: "😍", label: "Love it" },
];

export function FeedbackButton({ loggedIn, captcha = false }: { loggedIn: boolean; captcha?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [altcha, setAltcha] = useState<string | null>(null);
  const needsCaptcha = captcha && !loggedIn;
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) textarea.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setError("");
    try {
      await api("/api/feedback", { body: { rating, message, email, page: pathname, altcha } });
      setState("sent");
      setMessage("");
      setRating(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState("idle");
    }
  }

  return (
    <div className="feedback no-print">
      {open && (
        <div className="feedback__panel" role="dialog" aria-label="Send feedback">
          {state === "sent" ? (
            <div className="feedback__thanks">
              <p className="strong">Thank you! 🙏</p>
              <p className="muted small">We read every message.</p>
              <button type="button" className="button button--small" onClick={() => { setState("idle"); setOpen(false); }}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={send} className="feedback__form">
              <p className="strong">How&apos;s {SITE.name} so far?</p>
              <div className="feedback__moods" role="radiogroup" aria-label="Rating">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={rating === m.value}
                    aria-label={m.label}
                    title={m.label}
                    className={`feedback__mood${rating === m.value ? " is-selected" : ""}`}
                    onClick={() => setRating(m.value)}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
              <textarea
                ref={textarea}
                className="input input--small"
                rows={4}
                maxLength={3000}
                required
                placeholder="What's confusing, missing, or great?"
                aria-label="Your feedback"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {!loggedIn && (
                <input
                  className="input input--small"
                  type="email"
                  placeholder="Your email (optional, if you'd like a reply)"
                  aria-label="Your email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
              {needsCaptcha && <Captcha onChange={setAltcha} />}
              {error && <p className="error small" role="alert">{error}</p>}
              <div className="row row--end">
                <button type="button" className="button button--small" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="button button--small button--primary" disabled={state === "sending" || !message.trim() || (needsCaptcha && !altcha)}>
                  {state === "sending" ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      <button type="button" className="feedback__toggle" aria-expanded={open} aria-label="Feedback" onClick={() => setOpen((o) => !o)}>
        <MessageCircle size={18} aria-hidden="true" />
        <span className="feedback__label">Feedback</span>
      </button>
    </div>
  );
}

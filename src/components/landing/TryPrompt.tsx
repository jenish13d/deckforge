"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Landing-page prompt box: signs the visitor up, then opens the create screen with their topic filled in. */
export function TryPrompt() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  function start(event: React.FormEvent) {
    event.preventDefault();
    const topic = prompt.trim().slice(0, 1000);
    const next = topic ? `/?prompt=${encodeURIComponent(topic)}` : "/";
    router.push(`/signup?next=${encodeURIComponent(next)}`);
  }

  return (
    <form className="prompt-box prompt-box--landing" onSubmit={start}>
      <textarea
        className="prompt-box__input"
        rows={2}
        maxLength={1000}
        aria-label="What do you want to present?"
        placeholder="What do you want to present? For example, a pitch for my bakery…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <div className="prompt-box__bar">
        <span className="prompt-box__hint">Free plan · No credit card needed</span>
        <button type="submit" className="button button--primary prompt-box__go">
          Generate <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

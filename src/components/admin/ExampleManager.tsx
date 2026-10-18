"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/client";

export interface ExampleDeck {
  id: string;
  title: string;
  example: string | null;
  cards: number;
}

/** Publish your own decks as public example pages (/examples/<address>) that search engines can find. */
export function ExampleManager({ decks }: { decks: ExampleDeck[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function run(deckId: string, method: "POST" | "DELETE") {
    setBusy(deckId);
    setError("");
    try {
      await api("/api/admin/examples", { method, body: { deckId } });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
  }

  if (decks.length === 0) return <p className="muted">Make a deck first; your own decks appear here to publish.</p>;
  return (
    <div className="stack">
      <ul className="feedback-list">
        {decks.map((d) => (
          <li key={d.id} className="feedback-item row row--between">
            <span>
              {d.example ? <a href={`/examples/${d.example}`} target="_blank" rel="noreferrer">{d.title}</a> : d.title}{" "}
              <span className="muted small">· {d.cards} slides{d.example ? " · public example" : ""}</span>
            </span>
            <button type="button" className="button button--small" disabled={busy === d.id} onClick={() => run(d.id, d.example ? "DELETE" : "POST")}>
              {busy === d.id ? "…" : d.example ? "Take down" : "Publish as example"}
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

import Link from "next/link";

import type { CardContent } from "@/lib/cards";
import { CardView } from "./CardView";

export interface DeckSummary {
  id: string;
  title: string;
  theme: string;
  updatedAt: Date;
  cards: number;
  cover: CardContent | null;
}

export function DeckGrid({ decks }: { decks: DeckSummary[] }) {
  return (
    <ul className="deck-list">
      {decks.map((deck) => (
        <li key={deck.id}>
          <Link href={`/d/${deck.id}/edit`} className="deck-tile">
            <div className={`deck-tile__cover mini-card theme-${deck.theme}`}>
              {deck.cover ? (
                <CardView content={deck.cover} />
              ) : (
                <span className="deck-tile__preview">{deck.title}</span>
              )}
            </div>
            <span className="deck-tile__title">{deck.title}</span>
            <span className="deck-tile__meta">
              {deck.cards} cards · edited {deck.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

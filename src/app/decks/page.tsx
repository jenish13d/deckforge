import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { listDecks } from "@/lib/decks";

export const metadata = { title: "My decks · Deckforge" };

export default async function DecksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const decks = await listDecks(user.id);

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="row row--between">
          <h1 className="page-title">My decks</h1>
          <Link href="/" className="button button--primary">+ New deck</Link>
        </div>
        {decks.length === 0 ? (
          <p className="muted">No decks yet. Create your first one.</p>
        ) : (
          <ul className="deck-list">
            {decks.map((deck) => (
              <li key={deck.id}>
                <Link href={`/d/${deck.id}/edit`} className={`deck-tile theme-${deck.theme}`}>
                  <span className="deck-tile__preview">{deck.title}</span>
                  <span className="deck-tile__meta">
                    {deck.cards} cards · edited {deck.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { DeckGrid } from "@/components/DeckGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { listDecks } from "@/lib/decks";

export const metadata = { title: "My decks" };

export default async function DecksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/decks");
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
          <div className="empty-state">
            <p className="empty-state__icon" aria-hidden="true">🗂️</p>
            <h2>No decks yet</h2>
            <p className="muted">Your decks will appear here. Start from a template or describe your own idea.</p>
            <Link href="/" className="button button--primary">Create your first deck</Link>
          </div>
        ) : (
          <DeckGrid decks={decks} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}

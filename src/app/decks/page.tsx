import { LayoutGrid, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DeckGrid } from "@/components/DeckGrid";
import { AppShell } from "@/components/app/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { listDecks } from "@/lib/decks";

export const metadata = { title: "My decks" };

export default async function DecksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/decks");
  const decks = await listDecks(user.id);

  return (
    <AppShell next="/decks">
      <div className="page">
        <div className="row row--between page-head">
          <h1 className="page-title">My decks</h1>
          <Link href="/" className="button button--primary"><Plus size={18} aria-hidden="true" /> New deck</Link>
        </div>
        {decks.length === 0 ? (
          <div className="empty-state">
            <LayoutGrid size={40} className="empty-state__icon" aria-hidden="true" />
            <h2>No decks yet</h2>
            <p className="muted">Your decks will appear here. Start from a template or describe your own idea.</p>
            <Link href="/" className="button button--primary">Create your first deck</Link>
          </div>
        ) : (
          <DeckGrid decks={decks} />
        )}
      </div>
    </AppShell>
  );
}

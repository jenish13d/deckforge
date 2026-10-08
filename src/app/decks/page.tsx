import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DeckLibrary } from "@/components/DeckLibrary";
import { AppShell } from "@/components/app/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { listDecks } from "@/lib/decks";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { title: "My decks", robots: PRIVATE_ROBOTS };

export default async function DecksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/decks");
  const decks = await listDecks(user.id);

  return (
    <AppShell next="/decks">
      <div className="page">
        <div className="row row--between page-head">
          <div>
            <h1 className="page-title">My decks</h1>
            <p className="muted page-head__sub">{decks.length} {decks.length === 1 ? "deck" : "decks"}</p>
          </div>
          <Link href="/" className="button button--primary"><Plus size={18} aria-hidden="true" /> New deck</Link>
        </div>
        <DeckLibrary decks={decks} tools />
      </div>
    </AppShell>
  );
}

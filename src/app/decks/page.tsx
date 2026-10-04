import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DeckLibrary } from "@/components/DeckLibrary";
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
        <DeckLibrary decks={decks} tools />
      </div>
    </AppShell>
  );
}

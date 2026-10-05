import type { Metadata } from "next";
import { Lock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CardView } from "@/components/CardView";
import { SourcesList } from "@/components/SourcesList";
import { ViewerActions } from "@/components/ViewerActions";
import { getCurrentUser } from "@/lib/auth";
import { canView } from "@/lib/access";
import { getDeck } from "@/lib/decks";
import { SITE } from "@/lib/site";

async function load(id: string) {
  const [deck, user] = await Promise.all([getDeck(id), getCurrentUser()]);
  return { deck, user, visible: deck ? canView(deck, user?.id ?? null) : false };
}

export async function generateMetadata(props: PageProps<"/d/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const { deck, visible } = await load(id);
  if (!deck) return { title: "Deck not found" };
  if (!visible) return { title: "Private deck", robots: { index: false } };
  const description = `A presentation made with ${SITE.name}.`;
  return {
    title: deck.title,
    description,
    robots: { index: false },
    openGraph: { title: deck.title, description, type: "article" },
    twitter: { card: "summary_large_image", title: deck.title, description },
  };
}

export default async function ViewPage(props: PageProps<"/d/[id]">) {
  const { id } = await props.params;
  const { deck, user, visible } = await load(id);
  if (!deck) notFound();

  if (!visible) {
    return (
      <main className="page page--narrow">
        <div className="empty-state">
          <Lock size={40} className="empty-state__icon" aria-hidden="true" />
          <h1 className="page-title">This deck is private</h1>
          <p className="muted">Ask the person who sent it to turn on link sharing.</p>
          <Link href="/" className="button button--primary">Make your own with {SITE.name}</Link>
        </div>
      </main>
    );
  }

  const cards = deck.cards.flatMap((c) => (c.content ? [c.content] : []));
  const isOwner = user?.id === deck.userId;

  return (
    <>
      <header className="toolbar no-print">
        <Link href="/" className="toolbar__brand">{SITE.name}</Link>
        <h1 className="toolbar__heading">{deck.title}</h1>
        <ViewerActions deckId={deck.id} cards={cards} theme={deck.theme} title={deck.title} shared={deck.shared} isOwner={isOwner} />
      </header>
      <main className="page">
        <div className={`deck theme-${deck.theme}`}>
          {cards.map((content, i) => (
            <CardView key={i} content={content} index={i} />
          ))}
        </div>
        {cards.length === 0 && <p className="muted">This deck is still being written.</p>}
        <SourcesList sources={deck.sources} />
        <p className="made-with no-print">
          Made with <Link href="/">{SITE.name}</Link>
          {!user && <> · <Link href="/signup">Make your own free</Link></>}
        </p>
      </main>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CardView } from "@/components/CardView";
import { ViewerActions } from "@/components/ViewerActions";
import { getDeck } from "@/lib/decks";

export async function generateMetadata(props: PageProps<"/d/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const deck = await getDeck(id);
  return { title: deck ? `${deck.title} · Deckforge` : "Deck not found" };
}

export default async function ViewPage(props: PageProps<"/d/[id]">) {
  const { id } = await props.params;
  const deck = await getDeck(id);
  if (!deck) notFound();

  const cards = deck.cards.flatMap((c) => (c.content ? [c.content] : []));

  return (
    <>
      <header className="toolbar no-print">
        <Link href="/" className="toolbar__brand">Deckforge</Link>
        <h1 className="toolbar__heading">{deck.title}</h1>
        <ViewerActions cards={cards} theme={deck.theme} />
      </header>
      <main className="page">
        <div className={`deck theme-${deck.theme}`}>
          {cards.map((content, i) => (
            <CardView key={i} content={content} />
          ))}
        </div>
        {cards.length === 0 && <p className="muted">This deck is still being written.</p>}
        <p className="made-with no-print">
          Made with <Link href="/">Deckforge</Link>
        </p>
      </main>
    </>
  );
}

import { ImageResponse } from "next/og";

import { OG_SIZE, OgCard } from "@/components/OgCard";
import { getDeck } from "@/lib/decks";
import { SITE } from "@/lib/site";

export const alt = "Presentation preview";
export const size = OG_SIZE;
export const contentType = "image/png";
// Always current: titles change, and decks can be made private.
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = await getDeck(id);
  // Private or missing decks get a generic preview so their title isn't revealed.
  const visible = deck?.shared === true;
  const cards = visible ? deck.cards.length : 0;
  return new ImageResponse(
    <OgCard
      eyebrow={visible ? "Presentation" : "Private deck"}
      title={visible ? deck.title : "Beautiful slides in a minute"}
      footer={visible ? `${cards} slide${cards === 1 ? "" : "s"} · Made with ${SITE.name}` : `Made with ${SITE.name}`}
    />,
    size,
  );
}

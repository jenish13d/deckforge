import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Editor } from "@/components/Editor";
import { getCurrentUser } from "@/lib/auth";
import { getDeck } from "@/lib/decks";
import { imagesEnabled } from "@/lib/images";
import { availableModes, parallelCards } from "@/lib/providers";

export async function generateMetadata(props: PageProps<"/d/[id]/edit">): Promise<Metadata> {
  const { id } = await props.params;
  const [user, deck] = await Promise.all([getCurrentUser(), getDeck(id)]);
  // The deck's title only for its owner (others are redirected away).
  const title = deck && user && deck.userId === user.id ? `Edit: ${deck.title}` : "Edit deck";
  return { title, robots: { index: false } };
}

export default async function EditPage(props: PageProps<"/d/[id]/edit">) {
  const { id } = await props.params;
  const [user, deck] = await Promise.all([getCurrentUser(), getDeck(id)]);
  if (!deck) notFound();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/d/${id}/edit`)}`);
  // Other people's decks open in the view-only page.
  if (deck.userId !== user.id) redirect(`/d/${id}`);

  return <Editor initial={deck} initialCredits={user.credits} allowedModes={availableModes(user.plan)}
      parallel={parallelCards()}
      photosEnabled={imagesEnabled()}
    />;
}

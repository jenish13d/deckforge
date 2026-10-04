import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Editor } from "@/components/Editor";
import { getCurrentUser } from "@/lib/auth";
import { getDeck } from "@/lib/decks";
import { availableModes } from "@/lib/providers";

export const metadata: Metadata = { title: "Edit deck", robots: { index: false } };

export default async function EditPage(props: PageProps<"/d/[id]/edit">) {
  const { id } = await props.params;
  const [user, deck] = await Promise.all([getCurrentUser(), getDeck(id)]);
  if (!deck) notFound();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/d/${id}/edit`)}`);
  // Other people's decks open in the view-only page.
  if (deck.userId !== user.id) redirect(`/d/${id}`);

  return <Editor initial={deck} initialCredits={user.credits} allowedModes={availableModes(user.plan)} />;
}

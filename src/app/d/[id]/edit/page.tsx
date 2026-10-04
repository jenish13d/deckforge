import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Editor } from "@/components/Editor";
import { getDeck } from "@/lib/decks";

export const metadata: Metadata = { title: "Edit deck · Deckforge", robots: { index: false } };

export default async function EditPage(props: PageProps<"/d/[id]/edit">) {
  const { id } = await props.params;
  const deck = await getDeck(id);
  if (!deck) notFound();
  return <Editor initial={deck} />;
}

"use client";

import { Pencil, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { CardContent } from "@/lib/cards";
import { DownloadMenu } from "./DownloadMenu";
import { Presenter } from "./Presenter";
import { ShareDialog } from "./share/ShareDialog";

export function ViewerActions({
  deckId,
  cards,
  theme,
  title,
  shared,
  isOwner,
}: {
  deckId: string;
  cards: CardContent[];
  theme: string;
  title: string;
  shared: boolean;
  isOwner: boolean;
}) {
  const [presenting, setPresenting] = useState(false);
  const [sharing, setSharing] = useState(false);
  return (
    <>
      {isOwner && (
        <Link href={`/d/${deckId}/edit`} className="button"><Pencil size={16} aria-hidden="true" /> Edit</Link>
      )}
      <button type="button" className="button" onClick={() => setSharing(true)}>
        <Share2 size={16} aria-hidden="true" /> Share
      </button>
      <DownloadMenu cards={cards} theme={theme} title={title} />
      <button type="button" className="button button--primary" onClick={() => setPresenting(true)} disabled={cards.length === 0}>
        Present
      </button>
      {presenting && <Presenter cards={cards} theme={theme} onClose={() => setPresenting(false)} />}
      {sharing && <ShareDialog deckId={deckId} title={title} shared={shared} canManage={isOwner} onClose={() => setSharing(false)} />}
    </>
  );
}

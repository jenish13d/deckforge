"use client";

import { Pencil, Play, Share2 } from "lucide-react";
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
  badge = false,
}: {
  deckId: string;
  cards: CardContent[];
  theme: string;
  title: string;
  shared: boolean;
  isOwner: boolean;
  badge?: boolean;
}) {
  const [presenting, setPresenting] = useState(false);
  const [sharing, setSharing] = useState(false);
  return (
    <div className="studio-bar__actions">
      {isOwner && (
        <Link href={`/d/${deckId}/edit`} className="button" aria-label="Edit">
          <Pencil size={16} aria-hidden="true" /> <span className="button__label">Edit</span>
        </Link>
      )}
      <button type="button" className="button" onClick={() => setSharing(true)} aria-label="Share">
        <Share2 size={16} aria-hidden="true" /> <span className="button__label">Share</span>
      </button>
      <DownloadMenu cards={cards} theme={theme} title={title} badge={badge} />
      <button type="button" className="button button--primary studio-bar__present" onClick={() => setPresenting(true)} disabled={cards.length === 0} aria-label="Present">
        <Play size={16} aria-hidden="true" /> <span className="button__label">Present</span>
      </button>
      {presenting && <Presenter cards={cards} theme={theme} badge={badge} onClose={() => setPresenting(false)} />}
      {sharing && <ShareDialog deckId={deckId} title={title} shared={shared} canManage={isOwner} onClose={() => setSharing(false)} />}
    </div>
  );
}

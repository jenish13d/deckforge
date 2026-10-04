"use client";

import { CopyPlus, Ellipsis, ExternalLink, LayoutGrid, Lock, Pencil, Search, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CardView } from "@/components/CardView";
import { ShareDialog } from "@/components/share/ShareDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Menu } from "@/components/ui/Menu";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { CardContent } from "@/lib/cards";
import { api } from "@/lib/client";

export interface DeckSummary {
  id: string;
  title: string;
  theme: string;
  shared: boolean;
  createdAt: Date;
  updatedAt: Date;
  cards: number;
  cover: CardContent | null;
}

type Sort = "edited" | "newest" | "oldest" | "name";

const SORTS: Record<Sort, { label: string; compare: (a: DeckSummary, b: DeckSummary) => number }> = {
  edited: { label: "Last edited", compare: (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() },
  newest: { label: "Newest first", compare: (a, b) => b.createdAt.getTime() - a.createdAt.getTime() },
  oldest: { label: "Oldest first", compare: (a, b) => a.createdAt.getTime() - b.createdAt.getTime() },
  name: { label: "Name (A–Z)", compare: (a, b) => a.title.localeCompare(b.title) },
};

/**
 * The user's decks with a menu on each (open, share, rename, duplicate, delete).
 * With `tools`, adds search, sorting and selecting several decks to delete at once.
 */
export function DeckLibrary({ decks, tools = false }: { decks: DeckSummary[]; tools?: boolean }) {
  const router = useRouter();
  const [toast, showToast] = useToast();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("edited");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Optimistic updates until the server's list refreshes.
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [renamed, setRenamed] = useState<Record<string, string>>({});
  const [sharedOverride, setSharedOverride] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);
  const [renaming, setRenaming] = useState<DeckSummary | null>(null);
  const [sharing, setSharing] = useState<DeckSummary | null>(null);

  const all = decks
    .filter((d) => !removed.has(d.id))
    .map((d) => ({ ...d, title: renamed[d.id] ?? d.title, shared: sharedOverride[d.id] ?? d.shared }));
  const needle = query.trim().toLowerCase();
  const visible = all.filter((d) => !needle || d.title.toLowerCase().includes(needle)).sort(SORTS[sort].compare);
  const selectedVisible = visible.filter((d) => selected.has(d.id));

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function stopSelecting() {
    setSelecting(false);
    setSelected(new Set());
  }

  async function remove(ids: string[]) {
    await api("/api/decks", { method: "DELETE", body: { ids } });
    setRemoved((r) => new Set([...r, ...ids]));
    stopSelecting();
    showToast(ids.length === 1 ? "Deck deleted" : `${ids.length} decks deleted`);
    router.refresh();
  }

  async function duplicate(deck: DeckSummary) {
    try {
      await api(`/api/decks/${deck.id}/duplicate`, { body: {} });
      showToast("Copy created");
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e));
    }
  }

  if (all.length === 0) {
    return (
      <div className="empty-state">
        <LayoutGrid size={40} className="empty-state__icon" aria-hidden="true" />
        <h2>No decks yet</h2>
        <p className="muted">Your decks will appear here. Start from a template or describe your own idea.</p>
        <Link href="/" className="button button--primary">Create your first deck</Link>
        {toast}
      </div>
    );
  }

  return (
    <>
      {tools && (
        <div className="library-bar">
          {selecting ? (
            <>
              <strong className="library-bar__count">{selectedVisible.length} selected</strong>
              <button
                type="button"
                className="button button--small"
                onClick={() => setSelected(new Set(selectedVisible.length === visible.length ? [] : visible.map((d) => d.id)))}
              >
                {selectedVisible.length === visible.length ? "Select none" : "Select all"}
              </button>
              <span className="library-bar__spacer" />
              <button
                type="button"
                className="button button--small button--solid-danger"
                disabled={selectedVisible.length === 0}
                onClick={() => setConfirmDelete(selectedVisible.map((d) => d.id))}
              >
                <Trash2 size={15} aria-hidden="true" /> Delete
              </button>
              <button type="button" className="button button--small" onClick={stopSelecting}>Cancel</button>
            </>
          ) : (
            <>
              <label className="search-box">
                <Search size={16} aria-hidden="true" />
                <input type="search" placeholder="Search decks" aria-label="Search decks" value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
              <select className="input library-bar__sort" aria-label="Sort decks" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                {(Object.keys(SORTS) as Sort[]).map((s) => (
                  <option key={s} value={s}>{SORTS[s].label}</option>
                ))}
              </select>
              <button type="button" className="button button--small" onClick={() => setSelecting(true)}>Select</button>
            </>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="muted center">No decks match “{query}”.</p>
      ) : (
        <ul className="deck-list">
          {visible.map((deck) => {
            const isSelected = selected.has(deck.id);
            return (
              <li key={deck.id} className={`deck-card${isSelected ? " is-selected" : ""}`}>
                <Link
                  href={`/d/${deck.id}/edit`}
                  className="deck-tile"
                  onClick={(e) => {
                    if (!selecting) return;
                    e.preventDefault();
                    toggle(deck.id);
                  }}
                  aria-label={selecting ? `${isSelected ? "Unselect" : "Select"} ${deck.title}` : undefined}
                >
                  <div className={`deck-tile__cover mini-card theme-${deck.theme}`}>
                    {deck.cover ? <CardView content={deck.cover} /> : <span className="deck-tile__preview">{deck.title}</span>}
                  </div>
                  <span className="deck-tile__title">{deck.title}</span>
                  <span className="deck-tile__meta">
                    {!deck.shared && <><Lock size={12} aria-label="Private" /> </>}
                    {deck.cards} {deck.cards === 1 ? "card" : "cards"} · edited {deck.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </Link>
                {selecting ? (
                  <input type="checkbox" className="deck-card__check" checked={isSelected} onChange={() => toggle(deck.id)} aria-label={`Select ${deck.title}`} />
                ) : (
                  <div className="deck-card__menu">
                    <Menu label={{ text: `Options for ${deck.title}`, content: <Ellipsis size={18} aria-hidden="true" /> }} buttonClassName="icon-button icon-button--float">
                      {(close) => (
                        <>
                          <Link className="menu__item" role="menuitem" href={`/d/${deck.id}/edit`}><ExternalLink size={16} aria-hidden="true" /> Open</Link>
                          <button type="button" className="menu__item" role="menuitem" onClick={() => { close(); setSharing(deck); }}><Share2 size={16} aria-hidden="true" /> Share</button>
                          <button type="button" className="menu__item" role="menuitem" onClick={() => { close(); setRenaming(deck); }}><Pencil size={16} aria-hidden="true" /> Rename</button>
                          <button type="button" className="menu__item" role="menuitem" onClick={() => { close(); void duplicate(deck); }}><CopyPlus size={16} aria-hidden="true" /> Duplicate</button>
                          <button type="button" className="menu__item menu__item--danger" role="menuitem" onClick={() => { close(); setConfirmDelete([deck.id]); }}><Trash2 size={16} aria-hidden="true" /> Delete</button>
                        </>
                      )}
                    </Menu>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete.length === 1 ? "Delete this deck?" : `Delete ${confirmDelete.length} decks?`}
          message={
            confirmDelete.length === 1
              ? `“${all.find((d) => d.id === confirmDelete[0])?.title ?? "This deck"}” will be deleted for good, and its share link will stop working.`
              : "These decks will be deleted for good, and their share links will stop working."
          }
          confirmLabel="Delete"
          danger
          onConfirm={() => remove(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
      {renaming && (
        <RenameDialog
          deck={renaming}
          onClose={() => setRenaming(null)}
          onRenamed={(title) => {
            setRenamed((r) => ({ ...r, [renaming.id]: title }));
            router.refresh();
          }}
        />
      )}
      {sharing && (
        <ShareDialog
          deckId={sharing.id}
          title={sharing.title}
          shared={sharing.shared}
          canManage
          onClose={() => setSharing(null)}
          onSharedChange={(shared) => setSharedOverride((s) => ({ ...s, [sharing.id]: shared }))}
        />
      )}
      {toast}
    </>
  );
}

function RenameDialog({ deck, onClose, onRenamed }: { deck: DeckSummary; onClose: () => void; onRenamed: (title: string) => void }) {
  const [title, setTitle] = useState(deck.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;
    setBusy(true);
    try {
      await api(`/api/decks/${deck.id}`, { method: "PATCH", body: { title: value } });
      onRenamed(value);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <Modal title="Rename deck" onClose={onClose}>
      <form className="modal-form" onSubmit={save}>
        <input className="input" aria-label="Deck name" value={title} maxLength={120} autoFocus onChange={(e) => setTitle(e.target.value)} />
        {error && <p className="error small" role="alert">{error}</p>}
        <div className="row row--end">
          <button type="button" className="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button--primary" disabled={busy || !title.trim()}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}

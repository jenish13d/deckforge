import { BookOpen } from "lucide-react";

import type { Source } from "@/lib/research";

const siteOf = (s: Source) => (s.kind === "wikipedia" ? "Wikipedia" : new URL(s.url).hostname.replace(/^www\./, ""));

/** The sources a deck's facts were checked against, with links. */
export function SourcesList({ sources, compact = false }: { sources: Source[]; compact?: boolean }) {
  if (sources.length === 0) return null;
  return (
    <aside className={compact ? "sources sources--compact" : "sources"} aria-label="Sources">
      <h2 className="sources__title">
        <BookOpen size={16} aria-hidden="true" /> {compact ? `Researched from ${sources.length} source${sources.length === 1 ? "" : "s"}` : "Sources"}
      </h2>
      {!compact && (
        <p className="sources__note">
          Facts in this deck come from these sources. A number is shown only when two independent sources agree on it.
        </p>
      )}
      <ol className="sources__list">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer">
              <span className="sources__site">{siteOf(s)}</span> {s.title}
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}

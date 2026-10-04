import Link from "next/link";

import { CardView } from "@/components/CardView";
import { TEMPLATES } from "@/lib/templates";

/** Template tiles; each links to `hrefFor(template)`. */
export function TemplateGallery({ hrefFor }: { hrefFor: (id: string) => string }) {
  return (
    <div className="template-grid">
      {TEMPLATES.map((t) => (
        <Link key={t.id} href={hrefFor(t.id)} className="template-tile">
          <div className={`template-tile__preview mini-card theme-${t.theme}`}>
            <CardView content={t.preview} />
          </div>
          <strong>{t.icon} {t.name}</strong>
          <span className="muted small">{t.description}</span>
        </Link>
      ))}
    </div>
  );
}

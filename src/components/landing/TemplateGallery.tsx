import Link from "next/link";

import { CardView } from "@/components/CardView";
import { TemplateIcon } from "@/components/TemplateIcon";
import { TEMPLATES } from "@/lib/templates";

import { TiltZone } from "./TiltZone";

/** Template tiles; each links to `hrefFor(template)`. */
export function TemplateGallery({ hrefFor, scroll = false }: { hrefFor: (id: string) => string; /** Swipeable row on phones. */ scroll?: boolean }) {
  return (
    <TiltZone className={scroll ? "template-grid scroll-row" : "template-grid template-grid--page"}>
      {TEMPLATES.map((t) => (
        <Link key={t.id} href={hrefFor(t.id)} className="template-tile tilt">
          <div className={`template-tile__preview mini-card theme-${t.theme}`} aria-hidden="true" inert>
            <CardView content={t.preview} />
          </div>
          <strong className="template-tile__name"><TemplateIcon id={t.id} /> {t.name}</strong>
          <span className="muted small">{t.description}</span>
        </Link>
      ))}
    </TiltZone>
  );
}

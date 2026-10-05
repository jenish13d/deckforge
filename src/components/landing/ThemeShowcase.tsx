import { CardView } from "@/components/CardView";
import type { CardContent } from "@/lib/cards";
import { THEMES } from "@/lib/themes";

import { TiltZone } from "./TiltZone";

const SAMPLE: CardContent = {
  layout: "bullets",
  eyebrow: "",
  icon: "✨",
  title: "One deck, many looks",
  subtitle: "",
  items: [
    { heading: "Switch in one click", text: "Every card updates instantly." },
    { heading: "Made to present", text: "Readable on any screen." },
  ],
  stats: [],
  quote: "",
  quoteAuthor: "",
  table: { columns: [], rows: [] },
};

export function ThemeShowcase() {
  return (
    <TiltZone className="theme-grid scroll-row">
      {THEMES.map((t) => (
        <figure key={t.id} className="theme-grid__item tilt">
          <div className={`mini-card theme-${t.id}`} aria-hidden="true" inert>
            <CardView content={SAMPLE} />
          </div>
          <figcaption>{t.name}</figcaption>
        </figure>
      ))}
    </TiltZone>
  );
}

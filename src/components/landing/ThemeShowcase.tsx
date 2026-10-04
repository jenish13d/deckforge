import { CardView } from "@/components/CardView";
import type { CardContent } from "@/lib/cards";
import { THEMES } from "@/lib/themes";

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
    <div className="theme-grid scroll-row">
      {THEMES.map((t) => (
        <figure key={t.id} className="theme-grid__item">
          <div className={`mini-card theme-${t.id}`}>
            <CardView content={SAMPLE} />
          </div>
          <figcaption>{t.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}

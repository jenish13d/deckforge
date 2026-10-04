import { CardView } from "@/components/CardView";
import { TEMPLATES } from "@/lib/templates";

/** Two overlapping cards rendered by the product itself. */
export function HeroPreview() {
  const [back, front] = [TEMPLATES[2], TEMPLATES[0]];
  return (
    <div className="hero-preview" aria-hidden="true">
      <div className={`hero-preview__card hero-preview__card--back mini-card theme-${back.theme}`}>
        <CardView content={back.preview} />
      </div>
      <div className={`hero-preview__card hero-preview__card--front mini-card theme-${front.theme}`}>
        <CardView content={front.preview} />
      </div>
    </div>
  );
}

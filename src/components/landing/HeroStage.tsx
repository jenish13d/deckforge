"use client";

import { BadgeCheck, Globe } from "lucide-react";

import { CardView } from "@/components/CardView";
import { findTemplate } from "@/lib/templates";

import { useStageMotion } from "./useStageMotion";

// Real slides, rendered by the same component the editor uses, floating in 3D.
const SLIDES = ["report", "sales", "talk", "pitch"].map((id) => findTemplate(id)!);

/** Landing hero scene: a fan of real slides that tilts with the mouse and opens up as you scroll. */
export function HeroStage() {
  const ref = useStageMotion<HTMLDivElement>({ tilt: 7 });

  return (
    <div ref={ref} className="stage" aria-hidden="true" inert>
      <div className="stage__floor" />
      <div className="stage__rig">
        <span className="stage__sun" />
        {SLIDES.map((t, i) => (
          <div key={t.id} className="stage__slot" style={{ "--i": i } as React.CSSProperties}>
            <div className={`stage__slide mini-card theme-${t.theme}`}>
              <CardView content={t.preview} index={i} />
            </div>
          </div>
        ))}
        <span className="stage__chip stage__chip--a">
          <Globe size={15} /> Researched from real sources
        </span>
        <span className="stage__chip stage__chip--b">
          <BadgeCheck size={15} /> Every number checked
        </span>
      </div>
    </div>
  );
}

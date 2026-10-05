"use client";

import { BadgeCheck, Check, ListChecks, PenLine, Presentation, Search } from "lucide-react";

import { CardView } from "@/components/CardView";
import type { CardContent } from "@/lib/cards";
import type { ThemeId } from "@/lib/themes";

import { useStageMotion } from "./useStageMotion";

const blank = { eyebrow: "", icon: "", subtitle: "", items: [], stats: [], quote: "", quoteAuthor: "", table: { columns: [], rows: [] } };

// A sample deck. Every fact here is on the Colosseum pages of Wikipedia and Britannica.
const SLIDES: { theme: ThemeId; content: CardContent }[] = [
  { theme: "toscana", content: { ...blank, layout: "title", icon: "🏛️", title: "The Colosseum", subtitle: "Rome’s great amphitheatre, built in under a decade" } },
  {
    theme: "amalfi",
    content: {
      ...blank,
      layout: "stats",
      icon: "📏",
      title: "By the numbers",
      stats: [
        { value: "AD 80", label: "opened by Emperor Titus" },
        { value: "189 m", label: "long and 156 m wide" },
        { value: "50,000+", label: "spectators, estimated" },
      ],
    },
  },
  {
    theme: "paper",
    content: {
      ...blank,
      layout: "timeline",
      icon: "⏳",
      title: "Two thousand years",
      items: [
        { heading: "AD 72", text: "Building begins under Vespasian." },
        { heading: "AD 80", text: "Opens with 100 days of games." },
        { heading: "1980", text: "Listed by UNESCO with Rome’s historic centre." },
      ],
    },
  },
];

const SOURCES = [
  { site: "Wikipedia", page: "Colosseum" },
  { site: "Britannica", page: "Colosseum" },
  { site: "UNESCO", page: "Historic Centre of Rome" },
];

const STEPS = [
  { icon: PenLine, title: "Describe it", text: "Type a topic, paste notes, or pick a template." },
  { icon: Search, title: "Researched and checked", text: "Slidezza reads trusted sources and checks every number against them." },
  { icon: ListChecks, title: "Shape the outline", text: "Rename, reorder, add or cut cards before anything is written." },
  { icon: Presentation, title: "Get your deck", text: "Cards are written and designed for you. Edit, present, share." },
];

// Where each step after the first takes over, as scroll progress through the section.
const STEP_STARTS = [0.24, 0.5, 0.66];

/** "How it works" told as a scroll story: the prompt types, sources arrive, slides assemble in 3D. */
export function BuildStory() {
  const ref = useStageMotion<HTMLElement>({ tilt: 4, scroll: "pinned", steps: STEP_STARTS });

  return (
    <section ref={ref} id="how" className="story" data-step={STEPS.length - 1}>
      <div className="story__pin">
        <div className="story__copy">
          <p className="eyebrow">How it works</p>
          <h2 className="section-heading">Watch a deck build itself</h2>
          <ol className="story__steps">
            {STEPS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="story__step">
                <span className="story__step-icon" aria-hidden="true"><Icon size={20} /></span>
                <span className="story__step-text">
                  <strong>{title}</strong>
                  <span>{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="story__scene" aria-hidden="true" inert>
          <div className="story__prompt">
            <PenLine size={16} />
            <span className="story__typed"><span>The Roman Colosseum, for my history class</span></span>
          </div>

          <ul className="story__sources">
            {SOURCES.map((s, i) => (
              <li key={s.site} className="story__source" style={{ "--k": i } as React.CSSProperties}>
                <span className="story__favicon">{s.site[0]}</span>
                <span className="story__source-text"><strong>{s.site}</strong> {s.page}</span>
                <Check className="story__tick" size={15} />
              </li>
            ))}
            <li className="story__verdict"><BadgeCheck size={15} /> 189 m · found in 2 sources</li>
          </ul>

          <div className="story__outline">
            {SLIDES.map((s, i) => (
              <span key={s.content.title} className="story__outline-row" style={{ "--k": i } as React.CSSProperties}>
                <b>{i + 1}</b> {s.content.title}
              </span>
            ))}
          </div>

          <div className="story__deck">
            {SLIDES.map((s, i) => (
              <div key={s.content.title} className="story__slot" style={{ "--k": i } as React.CSSProperties}>
                <div className={`story__slide mini-card theme-${s.theme}`}>
                  <CardView content={s.content} index={i} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

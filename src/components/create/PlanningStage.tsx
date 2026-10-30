"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { Spinner3D } from "@/components/Spinner3D";
import { WorkTicker } from "@/components/WorkTicker";

// What the outline call itself produces for every card (see PlannedOutlineSchema and planDeck).
const SHAPING = [
  "Writing a key message for each card",
  "Choosing a layout for each card",
  "Spreading tables, timelines and charts across the deck",
  "Deciding which cards need a photo",
  "Checking the story flows from card to card",
];

// What the planner does, in the order it really happens (see generateOutline): read the
// topic, decide what to look up, search and read, then write the outline. Topics that need
// no research finish early, before the search steps would show.
const STEPS = [
  { at: 0, text: "Reading your topic", work: ["Finding the main subject", "Noting who it's for and the focus"] },
  { at: 1500, text: "Deciding what to look up", work: ["Choosing Wikipedia articles to read", "Planning web searches", "Checking whether review papers would help"] },
  { at: 3500, text: "Searching Wikipedia and the web", work: ["Searching Wikipedia", "Searching the web for independent pages", "Looking for highly cited review papers", "Skipping forums and social media"] },
  { at: 7500, text: "Reading the sources", work: ["Reading the articles, tables included", "Picking the passages that fit your topic", "Collecting facts with dates and numbers"] },
  { at: 12000, text: "Shaping your cards", work: SHAPING },
];

// With files attached, the planner reads them first.
const FILE_STEPS = [
  { at: 0, text: "Reading your files", work: ["Reading every page of your files", "Keeping your tables and figures"] },
  { at: 2000, text: "Finding the key facts", work: ["Finding the main points", "Noting names, numbers and dates"] },
  { at: 5000, text: "Checking what else to look up", work: ["Searching Wikipedia for background", "Searching the web for independent pages"] },
  { at: 9000, text: "Planning the story", work: ["Ordering the points into a story", "Deciding what each card must say"] },
  { at: 13000, text: "Shaping your cards", work: SHAPING },
];

/** The planning screen: drifting colour, slides assembling in 3D, and a live list of steps. */
export function PlanningStage({ topic, cardCount, files = 0 }: { topic: string; cardCount: number; files?: number }) {
  const steps = files > 0 ? FILE_STEPS : STEPS;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - start), 250);
    return () => clearInterval(timer);
  }, []);

  const current = steps.filter((s) => elapsed >= s.at).length - 1;
  // Never reaches the end on its own: it slows down instead of stopping, so the screen keeps moving.
  const progress = 0.95 * (1 - Math.exp(-elapsed / 14000));
  return (
    <div className="planning-stage" role="status" aria-live="polite">
      <div className="planning-stage__glow" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="planning-stage__scene" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="ghost-slide" style={{ "--i": i } as React.CSSProperties}>
            <span className="ghost-slide__title" />
            <span className="ghost-slide__line" />
            <span className="ghost-slide__line ghost-slide__line--short" />
            <span className="ghost-slide__media" />
          </div>
        ))}
      </div>
      <div className="planning-stage__panel">
        <p className="planning-stage__topic">{topic.length > 90 ? `${topic.slice(0, 90)}…` : topic}</p>
        <ol className="planning-steps">
          {steps.map((step, i) => {
            const state = i < current ? "done" : i === current ? "now" : "next";
            const text = i === steps.length - 1 ? `${step.text} (${cardCount})` : step.text;
            return (
              <li key={step.text} className={`planning-steps__item is-${state}`}>
                <span className="planning-steps__mark" aria-hidden="true">
                  {state === "done" ? <Check size={14} /> : state === "now" ? <Spinner3D size={14} /> : null}
                </span>
                {text}
                {state === "now" && "…"}
              </li>
            );
          })}
        </ol>
        <div className="progress planning-stage__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
        <WorkTicker className="planning-stage__ticker" lines={steps[current].work} />
        <p className="planning-stage__note">
          {files > 0
            ? "Your files lead; every other number is checked against the sources found."
            : "Every number is checked against the sources before it reaches a slide."}
        </p>
      </div>
    </div>
  );
}

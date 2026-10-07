"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { Spinner3D } from "@/components/Spinner3D";

// What the planner does, in the order it really happens (see generateOutline): read the
// topic, decide what to look up, search and read, then write the outline. Topics that need
// no research finish early, before the search steps would show.
const STEPS = [
  { at: 0, text: "Reading your topic" },
  { at: 1500, text: "Deciding what to look up" },
  { at: 3500, text: "Searching Wikipedia and the web" },
  { at: 7500, text: "Reading the sources" },
  { at: 12000, text: "Shaping your cards" },
];

// With files attached, the planner reads them first.
const FILE_STEPS = [
  { at: 0, text: "Reading your files" },
  { at: 2000, text: "Finding the key facts" },
  { at: 5000, text: "Checking what else to look up" },
  { at: 9000, text: "Planning the story" },
  { at: 13000, text: "Shaping your cards" },
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
        <p className="planning-stage__note">
          {files > 0
            ? "Your files lead; every other number is checked against two sources."
            : "Every number is checked against the sources before it reaches a slide."}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

/**
 * One line of what is happening right now, changing every couple of seconds, so a wait shows the work being
 * done. The lines must describe steps that really happen at that stage. Screen readers get the first line
 * only (via the surrounding status), not a stream of changes.
 */
export function WorkTicker({ lines, every = 1900, className = "" }: { lines: string[]; every?: number; className?: string }) {
  const [n, setN] = useState(0);
  const count = lines.length;
  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setN((i) => i + 1), every);
    return () => clearInterval(timer);
  }, [count, every]);
  if (lines.length === 0) return null;
  const line = lines[n % lines.length];
  return (
    <span className={`work-ticker ${className}`} aria-hidden="true">
      <span key={n} className="work-ticker__line">{line}</span>
    </span>
  );
}

/** What a card's job does at each stage (see generateCard in ai.ts and the photo step in jobs.ts). */
export function stageLines(stage: string | undefined, title: string): string[] {
  const subject = title.replace(/\*/g, "").slice(0, 60);
  switch (stage) {
    case "researching":
      return [`Looking up “${subject}” on Wikipedia`, "Searching the web for more on this point", "Picking the passages that match this slide", "Comparing what the sources say"];
    case "checking":
      return ["Checking every number against the sources", "Making sure two sources agree", "Confirming quotes word for word", "Removing anything the sources don't support"];
    case "photos":
      return ["Searching Wikimedia Commons for a photo", "Checking the photo's licence and credit", "Fitting the photo to the slide"];
    default:
      return ["Drafting the headline", "Choosing the best layout for this point", "Writing the points with specifics", "Writing the speaker notes", "Tightening the wording"];
  }
}

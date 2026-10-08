import Link from "next/link";

import { InfoPage, startFree } from "@/components/InfoPage";
import { MAX_FILES, MAX_FILE_MB } from "@/lib/material";
import { MODES, PLANS } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "How Slidezza Works — AI Presentation Maker",
  description: "See how Slidezza turns a topic, notes or files into researched, designed and editable presentation slides.",
  path: "/how-it-works",
  absoluteTitle: true,
});

const STEPS = [
  {
    title: "Start with a topic, a prompt or files",
    text: `Type what you want to present, pick a template, or attach your material: PDF (including scans), Word, PowerPoint, Excel, CSV, text, Markdown or photos. Up to ${MAX_FILES} files, ${MAX_FILE_MB} MB each. Documents are read in your browser; photos and scans are read by an AI model that can see images.`,
  },
  {
    title: "Answer a few questions",
    text: "Slidezza asks who the presentation is for and what to focus on, then you choose the length and the detail level. These answers change the outline, because a board update and a class talk need different slides.",
  },
  {
    title: "Review and edit the outline",
    text: "You see the plan as a list of cards before any slide is written. Rename, reorder, add or delete cards. The outline is free: you only use credits when cards are written.",
  },
  {
    title: "Research, when the topic needs it",
    text: "For factual topics Slidezza reads Wikipedia and independent web pages and keeps them as sources. If you attached files, those lead, and their figures are used as given. Personal, creative and planning topics, such as your own bakery's pitch or a team onboarding, are written without web research.",
  },
  {
    title: "Generate the slides",
    text: "Each card is written from the sources and your material, given a layout (such as bullets, columns, big numbers, a timeline, a table or a quote) and a theme, and matched with a credited photo where one helps. Cards are written one by one, so you can watch the deck appear.",
  },
  {
    title: "Review and edit",
    text: "Change any text by hand, or ask the assistant for a change, for example “make slide 3 a timeline” or “shorter”. Switch the theme, reorder cards or delete them. Nothing is locked.",
  },
  {
    title: "Present, share or download",
    text: `Present full screen, share a view-only link (or keep the deck private), download a PDF on any plan, or download an editable PowerPoint (.pptx) on Pro and Max.`,
  },
];

export default function HowItWorksPage() {
  return (
    <InfoPage
      path="/how-it-works"
      name="How it works"
      title={`How ${SITE.name} works`}
      lead={`${SITE.name} turns a topic, notes or files into researched, designed and editable slides. Here is each step, and where you stay in control.`}
    >
      <section className="section" aria-labelledby="steps">
        <h2 id="steps" className="section-heading">From idea to presentation in seven steps</h2>
        <ol className="steps">
          {STEPS.map((step, i) => (
            <li key={step.title} className="step">
              <span className="step__icon" aria-hidden="true">{i + 1}</span>
              <span className="step__text">
                <strong>{step.title}</strong>
                <span className="muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="section use-case__intro" aria-labelledby="sources">
        <h2 id="sources" className="section-heading">How sources and number checking work</h2>
        <p>
          For factual topics the AI writes only from the sources it found, and the sources are listed with the deck. When two or more sources are found, a number appears on a slide only when two independent sources agree on it (all Wikipedia articles count as one source, each website as one). A number the sources don&apos;t back up is removed. Quotes must be word for word from a source. Figures from your own files are used exactly as given and are listed as the file they came from.
        </p>
      </section>

      <section className="section use-case__intro" aria-labelledby="cost">
        <h2 id="cost" className="section-heading">What it costs</h2>
        <p>
          Writing a card uses credits: {MODES.quick.creditsPerCard} in Quick, {MODES.standard.creditsPerCard} in Standard and {MODES.premium.creditsPerCard} in Premium. Outlines are free and failed cards are refunded. The Free plan includes {PLANS.free.monthlyCredits} credits a month with no card needed. See <Link href="/pricing">pricing</Link> for Pro and Max.
        </p>
      </section>

      <section className="section use-case__intro" aria-labelledby="limits">
        <h2 id="limits" className="section-heading">What to check yourself</h2>
        <p>
          AI output can still contain mistakes, even with sources and number checks. Read the sources list, compare important figures with the originals, and edit anything that doesn&apos;t say what you mean before you present.
        </p>
        <p>
          <Link href={startFree} className="button button--primary">Start creating</Link>
        </p>
      </section>

      <section className="section" aria-labelledby="more">
        <h2 id="more" className="section-heading">Next</h2>
        <ul className="use-case__more">
          <li><Link href="/features">Features</Link></li>
          <li><Link href="/templates">Templates</Link></li>
          <li><Link href="/ai-presentation-generator">AI presentation generator</Link></li>
          <li><Link href="/document-to-presentation">Document to presentation</Link></li>
          <li><Link href="/about">About {SITE.name}</Link></li>
        </ul>
      </section>
    </InfoPage>
  );
}

import Link from "next/link";

import { InfoPage } from "@/components/InfoPage";
import { MAX_FILES } from "@/lib/material";
import { PLANS } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { TEMPLATES } from "@/lib/templates";
import { THEMES } from "@/lib/themes";

export const metadata = pageMetadata({
  title: "Slidezza Features — AI Presentation Maker",
  description: "Explore Slidezza features for creating, researching, designing, editing, presenting and sharing AI-generated presentations.",
  path: "/features",
  absoluteTitle: true,
});

interface Feature {
  id: string;
  title: string;
  text: string;
  href?: string;
  link?: string;
}

const FEATURES: Feature[] = [
  {
    id: "generation",
    title: "AI presentation generation",
    text: "Describe a topic or paste a prompt. Slidezza asks who it is for, drafts an outline for you to edit, then writes and designs every slide.",
    href: "/ai-presentation-generator",
    link: "How the generator works",
  },
  {
    id: "ppt",
    title: "AI PPT generation",
    text: `Make a deck and take it to PowerPoint: Pro and Max download an editable .pptx with real text boxes. Every plan can download a PDF.`,
    href: "/ai-ppt-maker",
    link: "AI PPT maker",
  },
  {
    id: "files",
    title: "File-to-presentation",
    text: `Attach up to ${MAX_FILES} files (PDF including scans, Word, PowerPoint, Excel, CSV, text, Markdown, or photos of notes). Slides follow your material and use its figures as given.`,
    href: "/document-to-presentation",
    link: "Document to presentation",
  },
  {
    id: "research",
    title: "Research and sources",
    text: "For factual topics Slidezza reads Wikipedia and independent web pages, writes from them and lists them with the deck.",
    href: "/how-it-works",
    link: "How it works",
  },
  {
    id: "numbers",
    title: "Number checking",
    text: "A number appears on a slide only when two independent sources agree on it. Quotes must be word for word. Figures from your own files are used as you gave them.",
    href: "/ai-presentation-maker",
    link: "AI presentation maker",
  },
  {
    id: "layouts",
    title: "Smart slide layouts",
    text: "Eight layouts: title, section, bullets, columns, big numbers, timeline, table and quote. Photos are credited and shown whole, never cut awkwardly.",
    href: "/ai-slide-generator",
    link: "AI slide generator",
  },
  {
    id: "themes",
    title: "Themes",
    text: `${THEMES.length} themes (${THEMES.map((t) => t.name).join(", ")}). Switch the look of the whole deck at any time without losing content.`,
    href: "/presentation-maker",
    link: "Presentation maker",
  },
  {
    id: "editing",
    title: "AI slide editing",
    text: "Edit any slide by hand, or ask the assistant: make slide 3 a timeline, shorten it, add a slide about costs. Reorder, add or delete slides.",
    href: "/ai-slide-generator",
    link: "AI slide generator",
  },
  {
    id: "present",
    title: "Present mode",
    text: "Present full screen from the browser with keyboard controls. Nothing to install.",
  },
  {
    id: "share",
    title: "Share links",
    text: "Send a view-only link that opens in any browser, with no account needed to view. Keep a deck private when you prefer.",
  },
  {
    id: "pdf",
    title: "PDF export",
    text: "Download any deck as a PDF on every plan, to email or print.",
  },
  {
    id: "pptx",
    title: "PowerPoint export",
    text: `Pro and Max download an editable PowerPoint (.pptx). The Free plan does not include it. See pricing for what is open now.`,
    href: "/pricing",
    link: "Pricing",
  },
  {
    id: "templates",
    title: "Templates",
    text: `${TEMPLATES.length} starting points: ${TEMPLATES.map((t) => t.name).join(", ")}. Each has a starting prompt you fill in.`,
    href: "/templates",
    link: "Browse templates",
  },
  {
    id: "languages",
    title: "Multilingual presentations",
    text: "Write your prompt or attach material in your language and the deck follows.",
  },
];

export default function FeaturesPage() {
  return (
    <InfoPage
      path="/features"
      name="Features"
      title={`${SITE.name} features`}
      lead={`Everything ${SITE.name} does to create, research, design, edit, present and share a presentation.`}
    >
      <section className="section" aria-labelledby="list">
        <h2 id="list" className="section-heading">What you can do</h2>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.id} id={f.id} className="feature">
              <h3 className="feature__title">{f.title}</h3>
              <span>{f.text}</span>
              {f.href && f.link && <Link href={f.href}>{f.link}</Link>}
            </div>
          ))}
        </div>
      </section>

      <section className="section use-case__intro" aria-labelledby="plans">
        <h2 id="plans" className="section-heading">Free and paid plans</h2>
        <p>
          The Free plan includes {PLANS.free.monthlyCredits} credits a month with no card needed. Pro and Max add more credits, Premium quality, all detail levels, PowerPoint download and no &ldquo;Made with {SITE.name}&rdquo; badge. <Link href="/pricing">See pricing</Link>.
        </p>
        <p>
          Not sure where to start? Read <Link href="/how-it-works">how it works</Link> or <Link href="/about">about {SITE.name}</Link>.
        </p>
      </section>
    </InfoPage>
  );
}

import Link from "next/link";

import { InfoPage } from "@/components/InfoPage";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "About Slidezza — AI Presentation Maker",
  description: "Learn what Slidezza is, why it was built, and how it helps turn ideas, notes and files into beautiful presentations.",
  path: "/about",
  absoluteTitle: true,
});

export default function AboutPage() {
  return (
    <InfoPage
      path="/about"
      name="About"
      pageType="AboutPage"
      title={`About ${SITE.name}`}
      lead={`${SITE.name} is an AI presentation maker. It turns a topic, your notes or your files into researched, designed slides that you can edit, present and share.`}
    >
      <section className="section use-case__intro" aria-labelledby="what">
        <h2 id="what" className="section-heading">What Slidezza is</h2>
        <p>
          {SITE.name} is a web-based product: you use it in your browser, with nothing to install. You describe what you want to present, or attach the material you already have, and it plans the story, writes the slides and designs them.
        </p>
        <p>Its workflow combines four things that are usually separate jobs: planning the outline, researching the facts, writing the slides and designing how they look.</p>
      </section>

      <section className="section use-case__intro" aria-labelledby="who">
        <h2 id="who" className="section-heading">Who it is for</h2>
        <p>
          Anyone who needs to present and would rather not start from a blank slide: students with a class talk, teachers preparing lessons, managers writing a report, founders and freelancers preparing a pitch or proposal, and people turning a document they already have into slides.
        </p>
      </section>

      <section className="section" aria-labelledby="does">
        <h2 id="does" className="section-heading">What it does</h2>
        <ul className="about-list">
          <li>Creates a presentation from a topic or prompt, in any language.</li>
          <li>Builds a presentation from your own files: PDF, Word, PowerPoint, Excel, CSV, text and Markdown, and photos or scans.</li>
          <li>Asks who the deck is for, then drafts an outline you can edit before any slide is written.</li>
          <li>Researches factual topics and lists the sources it used.</li>
          <li>Checks numbers against more than one source.</li>
          <li>Designs each slide with a layout and theme, and adds credited photos.</li>
          <li>Lets you edit by hand or ask an assistant to change a slide.</li>
          <li>Presents full screen, shares a link, downloads a PDF, and downloads an editable PowerPoint file on Pro and Max.</li>
        </ul>
      </section>

      <section className="section use-case__intro" aria-labelledby="different">
        <h2 id="different" className="section-heading">How it differs from building slides by hand</h2>
        <p>
          The usual way starts with a blank deck: you work out the structure, search for facts, find pictures and format every slide. With {SITE.name} you start with the idea. The structure, the research, the first draft of the text and the design come from the tool, and your time goes into checking and improving them.
        </p>
      </section>

      <section className="section use-case__intro" aria-labelledby="sources">
        <h2 id="sources" className="section-heading">Why sources and fact checking matter</h2>
        <p>
          AI can sound certain and still be wrong. For factual topics, {SITE.name} writes from the sources it finds, such as Wikipedia and independent web pages, and lists them with the deck. A number goes on a slide only when two independent sources agree on it, and quotes must be word for word from a source. Figures in your own files are used exactly as you gave them.
        </p>
        <p>This lowers the risk of mistakes but does not remove it. Review important facts before you present.</p>
      </section>

      <section className="section use-case__intro" aria-labelledby="design">
        <h2 id="design" className="section-heading">Why visual design matters</h2>
        <p>
          People judge a presentation by how it looks before they hear a word. {SITE.name} chooses a layout for each slide (for example bullets, columns, big numbers, a timeline, a table or a quote), applies one of its themes across the deck, and adds free-licence photos with their credits. Photos are shown whole rather than cut awkwardly.
        </p>
      </section>

      <section className="section use-case__intro" aria-labelledby="control">
        <h2 id="control" className="section-heading">You stay in control</h2>
        <p>
          Nothing is locked. You approve the outline first, can edit any slide by hand, can ask the assistant to rewrite or restructure a slide, and can switch themes at any time. Decks are private unless you share a link.
        </p>
      </section>

      <section className="section" aria-labelledby="explore">
        <h2 id="explore" className="section-heading">Explore {SITE.name}</h2>
        <ul className="use-case__more">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/how-it-works">How it works</Link></li>
          <li><Link href="/features">Features</Link></li>
          <li><Link href="/ai-presentation-maker">AI presentation maker</Link></li>
          <li><Link href="/ai-ppt-maker">AI PPT maker</Link></li>
          <li><Link href="/presentation-maker">Presentation maker</Link></li>
          <li><Link href="/templates">Templates</Link></li>
          <li><Link href="/pricing">Pricing</Link></li>
        </ul>
        {SITE.contactEmail && (
          <p className="muted">
            Questions? Write to <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
          </p>
        )}
      </section>
    </InfoPage>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CardView } from "@/components/CardView";
import { RevealDeck } from "@/components/RevealDeck";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SourcesList } from "@/components/SourcesList";
import { getDeck } from "@/lib/decks";
import { exampleDescription, exampleTitle, findExample, listExamples } from "@/lib/examples";
import { PLANS } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { deckSlides } from "@/lib/slides";
import { siteUrl } from "@/lib/url";

async function load(slug: string) {
  const found = await findExample(slug);
  const deck = found && (await getDeck(found.id));
  if (!found || !deck) return null;
  const cards = deckSlides(deck.cards.flatMap((c) => (c.content ? [c.content] : [])), deck.look);
  return { deck, cards, updatedAt: found.updatedAt, title: exampleTitle(deck.title), description: exampleDescription(deck.title, cards) };
}

export async function generateMetadata(props: PageProps<"/examples/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const example = await load(slug);
  if (!example) return { title: "Example not found", robots: { index: false } };
  return pageMetadata({ title: example.title, description: example.description, path: `/examples/${slug}` });
}

export default async function ExamplePage(props: PageProps<"/examples/[slug]">) {
  const { slug } = await props.params;
  const example = await load(slug);
  if (!example) notFound();
  const { deck, cards, updatedAt, title, description } = example;
  const base = siteUrl();
  const url = `${base}/examples/${slug}`;
  const outline = cards.map((c) => c.title.trim()).filter(Boolean);
  const start = `/signup?next=${encodeURIComponent(`/?prompt=${encodeURIComponent(deck.prompt.slice(0, 300))}`)}`;
  const others = (await listExamples()).filter((e) => e.example !== slug).slice(0, 8);
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "PresentationDigitalDocument",
      name: title,
      description,
      url,
      inLanguage: "en",
      isAccessibleForFree: true,
      dateModified: updatedAt.toISOString(),
      publisher: { "@type": "Organization", name: SITE.name, url: base },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE.name, item: base },
        { "@type": "ListItem", position: 2, name: "Examples", item: `${base}/examples` },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    },
  ];

  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
      <main id="main" className="page use-case">
        <nav aria-label="Breadcrumb" className="use-case__crumbs muted small">
          <Link href="/">{SITE.name}</Link> / <Link href="/examples">Examples</Link> / <span aria-current="page">{title}</span>
        </nav>
        <header className="hero hero--compact use-case__hero">
          <p className="eyebrow">Example presentation · {cards.length} slides</p>
          <h1 className="hero__title hero__title--small">{title}</h1>
          <p className="hero__subtitle">
            A real deck made with {SITE.name}, the AI presentation maker, shown exactly as it came out{deck.sources.length ? ", with the sources its facts come from" : ""}. Use it to study the topic, or make your own version in a minute.
          </p>
          <p className="row row--center">
            <Link href={start} className="button button--primary">Make your own on this topic</Link>
            <Link href={`/d/${deck.id}`} className="button">Open full screen</Link>
          </p>
          <p className="muted small">Free plan: {PLANS.free.monthlyCredits} credits a month, no card needed.</p>
        </header>

        <section className="section" aria-labelledby="inside">
          <h2 id="inside" className="section-heading">What&apos;s in this presentation</h2>
          <ol className="template-page__covers">
            {outline.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </section>

        <section className="section" aria-label="Slides">
          <RevealDeck className={`deck theme-${deck.theme}`}>
            {cards.map((content, i) => (
              <CardView key={i} content={content} index={i} badge={deck.look.badge} />
            ))}
          </RevealDeck>
          <SourcesList sources={deck.sources} />
          <p className="muted small">Made by AI from public sources. Check important facts against the sources before you present them.</p>
        </section>

        <section className="section" aria-labelledby="more">
          <h2 id="more" className="section-heading">More examples</h2>
          <ul className="use-case__more">
            {others.map((e) => (
              <li key={e.id}><Link href={`/examples/${e.example}`}>{exampleTitle(e.title)}</Link></li>
            ))}
            <li><Link href="/examples">All examples</Link></li>
          </ul>
          <h3 className="use-case__group-title">Make your own</h3>
          <ul className="use-case__more">
            <li><Link href="/">AI presentation maker</Link></li>
            <li><Link href="/presentation-maker-for-students">Presentation maker for students</Link></li>
            <li><Link href="/presentation-maker-for-teachers">Presentation maker for teachers</Link></li>
            <li><Link href="/templates">Templates</Link></li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

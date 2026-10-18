import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { exampleTitle, listExamples } from "@/lib/examples";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Presentation examples made with AI",
  description: `Real presentations made with ${SITE.name}, the AI presentation maker: open any deck free, see its sources, or make your own on the same topic.`,
  path: "/examples",
});

export default async function ExamplesPage() {
  const examples = await listExamples();
  return (
    <>
      <SiteHeader />
      <main id="main" className="page use-case">
        <header className="hero hero--compact use-case__hero">
          <p className="eyebrow">Examples</p>
          <h1 className="hero__title hero__title--small">Presentation examples made with AI</h1>
          <p className="hero__subtitle">
            Real decks made with {SITE.name}, shown as they came out, with their sources. Open one to read it, or make your own on any topic.
          </p>
          <p>
            <Link href="/signup" className="button button--primary">Make your own free</Link>
          </p>
        </header>
        <section className="section" aria-label="All examples">
          {examples.length === 0 ? (
            <p className="muted">The first examples are on their way. Meanwhile, see the <Link href="/templates">templates</Link>.</p>
          ) : (
            <ul className="use-case__more">
              {examples.map((e) => (
                <li key={e.id}>
                  <Link href={`/examples/${e.example}`}>{exampleTitle(e.title)}</Link> <span className="muted small">· {e._count.cards} slides</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

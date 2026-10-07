import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE } from "@/lib/site";
import { USE_CASES, findUseCase } from "@/lib/use-cases";
import { siteUrl } from "@/lib/url";

export const dynamicParams = false;

export function generateStaticParams() {
  return USE_CASES.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata(props: PageProps<"/make/[slug]">): Promise<Metadata> {
  const useCase = findUseCase((await props.params).slug);
  if (!useCase) return {};
  const path = `/make/${useCase.slug}`;
  return {
    title: useCase.title,
    description: useCase.description,
    alternates: { canonical: path },
    openGraph: { title: `${useCase.title} · ${SITE.name}`, description: useCase.description, url: path, type: "website" },
  };
}

const startHref = (prompt?: string) => `/signup?next=${encodeURIComponent(prompt ? `/?prompt=${encodeURIComponent(prompt)}` : "/")}`;

export default async function UseCasePage(props: PageProps<"/make/[slug]">) {
  const useCase = findUseCase((await props.params).slug);
  if (!useCase) notFound();
  const url = `${siteUrl()}/make/${useCase.slug}`;
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: useCase.title,
      description: useCase.description,
      url,
      isPartOf: { "@type": "WebSite", name: SITE.name, url: siteUrl() },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE.name, item: siteUrl() },
        { "@type": "ListItem", position: 2, name: useCase.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: useCase.faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  const others = USE_CASES.filter((u) => u.slug !== useCase.slug);

  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        // "<" is escaped so text can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
      />
      <main id="main" className="page use-case">
        <nav aria-label="Breadcrumb" className="use-case__crumbs muted small">
          <Link href="/">{SITE.name}</Link> / <span aria-current="page">{useCase.name}</span>
        </nav>
        <header className="hero hero--compact use-case__hero">
          <p className="eyebrow">{useCase.name}</p>
          <h1 className="hero__title hero__title--small">{useCase.title}</h1>
          <p className="hero__subtitle">{useCase.lead}</p>
          <p>
            <Link href={startHref()} className="button button--primary">
              Start free
            </Link>
          </p>
          <p className="muted small">Free plan: 60 credits a month, no card needed.</p>
        </header>

        <section className="section" aria-labelledby="how">
          <h2 id="how" className="section-heading">How it works</h2>
          <ol className="steps">
            {useCase.steps.map((step, i) => (
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

        <section className="section" aria-labelledby="why">
          <h2 id="why" className="section-heading">What you get</h2>
          <div className="feature-grid">
            {useCase.points.map((point) => (
              <div key={point.title} className="feature">
                <strong>{point.title}</strong>
                <span>{point.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="ideas">
          <h2 id="ideas" className="section-heading">Try one of these</h2>
          <ul className="use-case__prompts">
            {useCase.prompts.map((prompt) => (
              <li key={prompt}>
                <Link href={startHref(prompt)}>{prompt}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="section" aria-labelledby="faq">
          <h2 id="faq" className="section-heading">Questions</h2>
          <div className="faq">
            {useCase.faq.map(({ q, a }) => (
              <details key={q} className="faq__item">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="more">
          <h2 id="more" className="section-heading">More ways to use {SITE.name}</h2>
          <ul className="use-case__more">
            {others.map((u) => (
              <li key={u.slug}>
                <Link href={`/make/${u.slug}`}>{u.name}</Link>
              </li>
            ))}
            <li>
              <Link href="/templates">Templates</Link>
            </li>
            <li>
              <Link href="/pricing">Pricing</Link>
            </li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

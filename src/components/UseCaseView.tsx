import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { PLANS } from "@/lib/plans";
import { SITE } from "@/lib/site";
import { relatedFor } from "@/lib/search-pages";
import type { UseCase } from "@/lib/use-cases";
import { siteUrl } from "@/lib/url";

export const startHref = (prompt?: string) => `/signup?next=${encodeURIComponent(prompt ? `/?prompt=${encodeURIComponent(prompt)}` : "/")}`;

/** A search landing page: a guide to one thing people look for, with FAQ and structured data. */
export function UseCaseView({ useCase, path }: { useCase: UseCase; path: string }) {
  const base = siteUrl();
  const related = relatedFor(path);
  const glance: [string, string][] = [
    ["Who it's for", useCase.who ?? ""],
    ["What you can make", useCase.makes ?? ""],
    ["Export", `PDF on every plan. Editable PowerPoint (.pptx) on Pro and Max. Present online or share a view-only link.`],
    ["Cost", `The Free plan gives ${PLANS.free.monthlyCredits} credits a month with no card. Pro and Max add more credits, all detail levels and PowerPoint download. See pricing.`],
    ["Limits", useCase.limits ?? ""],
  ];
  const url = `${base}${path}`;
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: useCase.title,
      description: useCase.description,
      url,
      isPartOf: { "@type": "WebSite", "@id": `${base}/#website`, name: SITE.name, url: base },
      about: { "@type": "SoftwareApplication", "@id": `${base}/#app`, name: SITE.name, url: base, applicationCategory: "BusinessApplication", operatingSystem: "Web browser" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE.name, item: base },
        { "@type": "ListItem", position: 2, name: useCase.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: useCase.faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

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
          <h1 className="hero__title hero__title--small">{useCase.heading ?? useCase.title}</h1>
          <p className="hero__subtitle">{useCase.lead}</p>
          <p>
            <Link href={startHref()} className="button button--primary">
              Start free
            </Link>
          </p>
          <p className="muted small">Free plan: {PLANS.free.monthlyCredits} credits a month, no card needed.</p>
        </header>

        {useCase.intro && (
          <section className="section use-case__intro" aria-label={`About ${useCase.name}`}>
            {useCase.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        )}

        <section className="section" aria-labelledby="glance">
          <h2 id="glance" className="section-heading">At a glance</h2>
          <dl className="glance">
            {glance
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="glance__row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
        </section>

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
          <h2 id="more" className="section-heading">Related guides</h2>
          {related.map((group) => (
            <div key={group.heading} className="use-case__group">
              <h3 className="use-case__group-title">{group.heading}</h3>
              <ul className="use-case__more">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <ul className="use-case__more">
            <li>
              <Link href="/how-it-works">How it works</Link>
            </li>
            <li>
              <Link href="/features">Features</Link>
            </li>
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

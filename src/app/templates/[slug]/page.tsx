import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CardView } from "@/components/CardView";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TemplateIcon } from "@/components/TemplateIcon";
import { PLANS } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { TEMPLATE_PAGES, findTemplatePage, templateFor } from "@/lib/template-pages";
import { siteUrl } from "@/lib/url";

export const dynamicParams = false;

export function generateStaticParams() {
  return TEMPLATE_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/templates/[slug]">): Promise<Metadata> {
  const page = findTemplatePage((await props.params).slug);
  if (!page) return {};
  return pageMetadata({ title: page.title, description: page.description, path: `/templates/${page.slug}` });
}

export default async function TemplatePage(props: PageProps<"/templates/[slug]">) {
  const page = findTemplatePage((await props.params).slug);
  if (!page) notFound();
  const template = templateFor(page);
  const base = siteUrl();
  const url = `${base}/templates/${page.slug}`;
  const start = `/signup?next=${encodeURIComponent(`/?template=${template.id}`)}`;
  const data = [
    { "@context": "https://schema.org", "@type": "WebPage", name: page.title, description: page.description, url, isPartOf: { "@type": "WebSite", name: SITE.name, url: base } },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE.name, item: base },
        { "@type": "ListItem", position: 2, name: "Templates", item: `${base}/templates` },
        { "@type": "ListItem", position: 3, name: template.name, item: url },
      ],
    },
  ];
  const others = TEMPLATE_PAGES.filter((p) => p.slug !== page.slug);

  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
      <main id="main" className="page use-case">
        <nav aria-label="Breadcrumb" className="use-case__crumbs muted small">
          <Link href="/">{SITE.name}</Link> / <Link href="/templates">Templates</Link> / <span aria-current="page">{template.name}</span>
        </nav>
        <header className="hero hero--compact use-case__hero">
          <p className="eyebrow"><TemplateIcon id={template.id} /> {template.name}</p>
          <h1 className="hero__title hero__title--small">{page.title}</h1>
          <p className="hero__subtitle">{page.lead}</p>
          <p>
            <Link href={start} className="button button--primary">Use this template</Link>
          </p>
          <p className="muted small">Free plan: {PLANS.free.monthlyCredits} credits a month, no card needed.</p>
        </header>

        <section className="section template-page__preview" aria-label="Example slide">
          <div className={`mini-card theme-${template.theme}`} role="img" aria-label={`Example slide from the ${template.name} template`}>
            <CardView content={template.preview} preview />
          </div>
          <p className="muted small center">An example slide in the {template.theme} theme. Your deck is written for your topic.</p>
        </section>

        <section className="section" aria-labelledby="covers">
          <h2 id="covers" className="section-heading">What the template covers</h2>
          <ul className="template-page__covers">
            {page.covers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="section" aria-labelledby="who">
          <h2 id="who" className="section-heading">Who it&apos;s for</h2>
          <p>{page.suits}</p>
          <h2 id="example" className="section-heading">An example</h2>
          <p>{page.example}</p>
          <p className="muted small">An illustration of how the template is used, not a real customer.</p>
        </section>

        <section className="section" aria-labelledby="prompt">
          <h2 id="prompt" className="section-heading">The starting prompt</h2>
          <p className="muted">Replace the [brackets] with your details. You answer two quick questions and edit the outline before any slide is written.</p>
          <blockquote className="template-page__prompt">{template.prompt}</blockquote>
        </section>

        <section className="section" aria-labelledby="more">
          <h2 id="more" className="section-heading">More templates</h2>
          <ul className="use-case__more">
            {others.map((p) => (
              <li key={p.slug}><Link href={`/templates/${p.slug}`}>{templateFor(p).name}</Link></li>
            ))}
            <li><Link href="/templates">All templates</Link></li>
          </ul>
          <h3 className="use-case__group-title">Related guides</h3>
          <ul className="use-case__more">
            {page.also.map((link) => (
              <li key={link.href}><Link href={link.href}>{link.name}</Link></li>
            ))}
            <li><Link href="/how-it-works">How it works</Link></li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { organizationJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { siteUrl } from "@/lib/url";

export const startFree = "/signup";

/** A plain public page (About, How it works, Features): breadcrumb, heading, structured data and footer. */
export function InfoPage({
  path,
  name,
  title,
  lead,
  pageType = "WebPage",
  children,
}: {
  path: string;
  name: string;
  title: string;
  lead: string;
  pageType?: "WebPage" | "AboutPage";
  children: ReactNode;
}) {
  const base = siteUrl();
  const url = `${base}${path}`;
  const data = [
    {
      "@context": "https://schema.org",
      "@type": pageType,
      "@id": `${url}#webpage`,
      name: title,
      url,
      description: lead,
      isPartOf: { "@type": "WebSite", "@id": `${base}/#website`, name: SITE.name, url: base },
      about: { "@type": "SoftwareApplication", "@id": `${base}/#app`, name: SITE.name, url: base },
      ...(pageType === "AboutPage" ? { mainEntity: organizationJsonLd() } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE.name, item: base },
        { "@type": "ListItem", position: 2, name, item: url },
      ],
    },
  ];
  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
      <main id="main" className="page use-case">
        <nav aria-label="Breadcrumb" className="use-case__crumbs muted small">
          <Link href="/">{SITE.name}</Link> / <span aria-current="page">{name}</span>
        </nav>
        <header className="hero hero--compact use-case__hero">
          <h1 className="hero__title hero__title--small">{title}</h1>
          <p className="hero__subtitle">{lead}</p>
          <p>
            <Link href={startFree} className="button button--primary">
              Start free
            </Link>
          </p>
        </header>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

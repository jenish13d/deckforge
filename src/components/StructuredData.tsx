import { QUESTIONS } from "@/components/landing/Faq";
import { PLAN_IDS, PLANS } from "@/lib/plans";
import { THEMES } from "@/lib/themes";
import { SITE } from "@/lib/site";
import { siteUrl } from "@/lib/url";

/**
 * schema.org data for the home page, so search engines and AI assistants can read
 * what the product is, what it costs and the FAQ. Facts only: no ratings or reviews.
 */
export function StructuredData() {
  const url = siteUrl();
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${url}/#app`,
      name: SITE.name,
      url,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "AI presentation maker",
      operatingSystem: "Web browser",
      description: SITE.seoDescription,
      featureList: [
        "Turn a topic, notes or files (PDF, Word, PowerPoint, Excel, photos) into a presentation with AI",
        "Quick setup questions and an editable outline before slides are written",
        "Research from Wikipedia and the web, with sources listed and numbers checked against two sources",
        "Low, Medium and High detail levels",
        `${THEMES.length} themes, 8 slide layouts (including tables, timelines and big numbers), credited stock photos`,
        "An assistant that adds or rewrites slides from a plain request",
        "Present mode, share links, PDF and PowerPoint download",
        "Works in any language",
      ],
      offers: PLAN_IDS.map((id) => ({
        "@type": "Offer",
        name: PLANS[id].label,
        price: PLANS[id].price.replace(/[^\d.]/g, ""),
        priceCurrency: "USD",
        description: `${PLANS[id].monthlyCredits.toLocaleString("en-US")} credits per month`,
        url: `${url}/pricing`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE.name,
      url,
      logo: `${url}/apple-icon`,
      ...(SITE.contactEmail ? { email: SITE.contactEmail } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: QUESTIONS.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be inline; "<" is escaped so text can't close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

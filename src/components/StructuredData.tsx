import { QUESTIONS } from "@/components/landing/Faq";
import { PLANS } from "@/lib/plans";
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
      name: SITE.name,
      url,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "AI presentation maker",
      operatingSystem: "Web browser",
      description: SITE.description,
      featureList: [
        "Turn a topic or notes into a presentation with AI",
        "Editable outline before slides are written",
        "Eight themes, seven slide layouts, free stock photos",
        "Present mode, share links, PDF and PowerPoint download",
        "Works in any language",
      ],
      offers: [
        { "@type": "Offer", name: PLANS.free.label, price: "0", priceCurrency: "USD" },
        { "@type": "Offer", name: PLANS.pro.label, price: "12", priceCurrency: "USD", description: `${PLANS.pro.monthlyCredits} credits per month` },
      ],
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

import type { Metadata } from "next";

import { SITE } from "./site";
import { siteUrl } from "./url";

const PREVIEW_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE.name}: AI presentation maker` };

/** Pages that must stay out of search results: sign-in, account and app screens. */
export const PRIVATE_ROBOTS: Metadata["robots"] = { index: false, follow: false };

/**
 * Metadata for a public page: title, description, canonical address and the Open Graph and
 * Twitter fields, so every public page describes itself the same way. `absoluteTitle` skips
 * the "· Slidezza" suffix when the title already names the product.
 */
export function pageMetadata({ title, description, path, absoluteTitle = false }: { title: string; description: string; path: string; absoluteTitle?: boolean }): Metadata {
  const full = absoluteTitle ? title : `${title} · ${SITE.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    // A page that sets openGraph replaces the inherited one, so the shared preview image is named here.
    openGraph: { title: full, description, url: path, siteName: SITE.name, type: "website", images: [PREVIEW_IMAGE] },
    twitter: { card: "summary_large_image", title: full, description, images: [PREVIEW_IMAGE.url] },
  };
}

/** The one Organization every page refers to. Only facts we have: name, address and logo. */
export const organizationJsonLd = () => ({
  "@type": "Organization",
  "@id": `${siteUrl()}/#organization`,
  name: SITE.name,
  url: siteUrl(),
  logo: `${siteUrl()}/apple-icon`,
  ...(SITE.contactEmail ? { email: SITE.contactEmail } : {}),
});

import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
  return {
    // Deck pages stay crawlable so chat apps can build link previews; they ask not to be indexed.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/account", "/decks"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

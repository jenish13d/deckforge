import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/url";

// Public pages only; decks are private to their links.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return ["", "/templates", "/pricing", "/signup", "/login", "/privacy", "/terms"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}

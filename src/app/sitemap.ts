import type { MetadataRoute } from "next";

import { SEARCH_PAGES } from "@/lib/search-pages";
import { TEMPLATE_PAGES } from "@/lib/template-pages";
import { siteUrl } from "@/lib/url";
import { USE_CASES } from "@/lib/use-cases";

const SEARCH_SLUGS = new Set(SEARCH_PAGES.map((p) => `/${p.slug}`));

// Public pages only; decks are private to their links.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages = ["", "/pricing", "/pro", "/templates", ...SEARCH_PAGES.map((p) => `/${p.slug}`), ...USE_CASES.map((u) => `/make/${u.slug}`), ...TEMPLATE_PAGES.map((p) => `/templates/${p.slug}`), "/signup", "/login", "/privacy", "/terms"];
  return pages.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : SEARCH_SLUGS.has(path) ? 0.9 : path.startsWith("/make/") || path.startsWith("/templates/") || path === "/pricing" ? 0.8 : 0.5,
  }));
}

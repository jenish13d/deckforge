import type { MetadataRoute } from "next";

import { guidePaths } from "@/lib/search-pages";
import { TEMPLATE_PAGES } from "@/lib/template-pages";
import { siteUrl } from "@/lib/url";

// Public pages that should appear in search. Sign-in, account and app screens are left out, and so are
// decks (private to their links). No lastModified: we don't track real edit dates for these pages.
const CORE = ["/pricing", "/features", "/how-it-works", "/about", "/templates"];
const SEARCH_ENTRY = new Set(["/ai-presentation-maker", "/ai-ppt-maker", "/presentation-maker", "/ai-powerpoint-generator"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const priority = (path: string) =>
    path === "" ? 1 : SEARCH_ENTRY.has(path) ? 0.9 : path === "/pricing" || path === "/features" || path === "/how-it-works" || path === "/templates" ? 0.8 : path === "/about" ? 0.6 : 0.7;
  const paths = ["", ...CORE, ...guidePaths(), ...TEMPLATE_PAGES.map((p) => `/templates/${p.slug}`)];
  return paths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: priority(path),
  }));
}

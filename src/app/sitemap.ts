import type { MetadataRoute } from "next";

import { listExamples } from "@/lib/examples";
import { prelaunchOn } from "@/lib/prelaunch";
import { guidePaths } from "@/lib/search-pages";
import { TEMPLATE_PAGES } from "@/lib/template-pages";
import { siteUrl } from "@/lib/url";

// Public pages that should appear in search. Sign-in, account and app screens are left out, and so are
// decks (private to their links) unless an admin published one as an example. No lastModified: we don't track real edit dates for these pages.
const CORE = ["/pricing", "/features", "/how-it-works", "/about", "/templates", "/examples"];
const SEARCH_ENTRY = new Set(["/ai-presentation-maker", "/ai-ppt-maker", "/presentation-maker", "/ai-powerpoint-generator"]);

// Example decks are listed too, with their real edit dates. Built on request so new examples show up.
export const dynamic = "force-dynamic";

async function examples(base: string): Promise<MetadataRoute.Sitemap> {
  try {
    return (await listExamples()).map((e) => ({ url: `${base}/examples/${e.example}`, lastModified: e.updatedAt, changeFrequency: "monthly", priority: 0.6 }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const priority = (path: string) =>
    path === "" ? 1 : SEARCH_ENTRY.has(path) ? 0.9 : path === "/pricing" || path === "/features" || path === "/how-it-works" || path === "/templates" ? 0.8 : path === "/about" ? 0.6 : 0.7;
  // Before launch only the launching-soon home page is public.
  const paths = prelaunchOn() ? [""] : ["", ...CORE, ...guidePaths(), ...TEMPLATE_PAGES.map((p) => `/templates/${p.slug}`)];
  const pages: MetadataRoute.Sitemap = paths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: priority(path),
  }));
  return prelaunchOn() ? pages : [...pages, ...(await examples(base))];
}

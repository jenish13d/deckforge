import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/url";
import { USE_CASES } from "@/lib/use-cases";

// Public pages only; decks are private to their links.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages = ["", "/pricing", "/pro", "/templates", ...USE_CASES.map((u) => `/make/${u.slug}`), "/signup", "/login", "/privacy", "/terms"];
  return pages.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/make/") || path === "/pricing" ? 0.8 : 0.5,
  }));
}

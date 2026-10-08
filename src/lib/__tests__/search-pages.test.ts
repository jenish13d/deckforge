import { describe, expect, it } from "vitest";

import { CLUSTERS, allGuides, findGuide, guidePaths, relatedFor } from "../search-pages";
import { TEMPLATE_PAGES, templateFor } from "../template-pages";
import { SEARCH_PAGES } from "../search-pages";

// Pages that already exist at the top level; a search page must never shadow one.
const ROUTES = ["about", "account", "admin", "api", "d", "decks", "features", "forgot-password", "guide", "how-it-works", "login", "make", "pricing", "privacy", "pro", "report", "reset-password", "signup", "templates", "terms", "llms.txt", "sitemap.xml", "robots.txt"];

const PAGES = allGuides();

describe("search landing pages", () => {
  it("have unique slugs that don't clash with real routes", () => {
    const slugs = SEARCH_PAGES.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.filter((s) => ROUTES.includes(s))).toEqual([]);
    expect(new Set(guidePaths()).size).toBe(PAGES.length);
  });

  it("have titles and descriptions that fit a search result, each different", () => {
    for (const page of PAGES) {
      expect(page.title.length, page.slug).toBeLessThanOrEqual(49);
      expect(page.description.length, page.slug).toBeLessThanOrEqual(175);
      expect(page.faq.length, page.slug).toBeGreaterThanOrEqual(3);
    }
    for (const field of ["title", "description", "lead"] as const) {
      const values = PAGES.map((p) => p[field]);
      expect(new Set(values).size, field).toBe(values.length);
    }
  });

  it("answer who, what, limits and have an intro", () => {
    for (const page of PAGES) {
      expect(page.who, page.slug).toBeTruthy();
      expect(page.makes, page.slug).toBeTruthy();
      expect(page.limits, page.slug).toBeTruthy();
      expect(page.intro?.length, page.slug).toBeGreaterThanOrEqual(1);
    }
  });

  it("make no claims we can't back up", () => {
    const text = JSON.stringify(PAGES).toLowerCase();
    for (const banned of ["100%", "risk free", "risk-free", "no mistakes", "guarantee", "#1", "best ai", "users love", "trusted by", "rated"]) {
      expect(text.includes(banned) && new RegExp(`(^|\\W)${banned.replace(/[#%-]/g, "\\$&")}(\\W|$)`).test(text), banned).toBe(false);
    }
  });

  it("link only to pages that exist, and every page sits in a topic group", () => {
    const templatePaths = TEMPLATE_PAGES.map((p) => `/templates/${p.slug}`);
    const known = new Set([...guidePaths(), ...templatePaths, "/pricing", "/templates"]);
    for (const cluster of CLUSTERS) for (const path of cluster.paths) expect(findGuide(path), path).toBeTruthy();
    for (const page of PAGES) {
      for (const href of page.also ?? []) expect(known.has(href), `${page.slug} -> ${href}`).toBe(true);
      expect(CLUSTERS.some((c) => c.paths.includes(page.path)), page.path).toBe(true);
      expect(relatedFor(page.path).flatMap((g) => g.links).some((l) => l.href === page.path), page.path).toBe(false);
    }
  });

  it("template pages point at real templates and real guides", () => {
    const slugs = TEMPLATE_PAGES.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const known = new Set(guidePaths());
    for (const page of TEMPLATE_PAGES) {
      expect(templateFor(page).prompt).toBeTruthy();
      expect(page.example.length).toBeGreaterThan(40);
      for (const link of page.also) expect(known.has(link.href), link.href).toBe(true);
    }
    expect(new Set(TEMPLATE_PAGES.map((p) => p.description)).size).toBe(TEMPLATE_PAGES.length);
  });
});

import { describe, expect, it } from "vitest";

import { SEARCH_PAGES, guideLinks } from "../search-pages";
import { TEMPLATE_PAGES, templateFor } from "../template-pages";
import { USE_CASES } from "../use-cases";

// Pages that already exist at the top level; a search page must never shadow one.
const ROUTES = ["account", "admin", "api", "d", "decks", "forgot-password", "guide", "login", "make", "pricing", "privacy", "pro", "report", "reset-password", "signup", "templates", "terms", "llms.txt", "sitemap.xml", "robots.txt"];

const PAGES = [...SEARCH_PAGES, ...USE_CASES];

describe("search landing pages", () => {
  it("have unique slugs that don't clash with real routes", () => {
    const slugs = SEARCH_PAGES.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.filter((s) => ROUTES.includes(s))).toEqual([]);
    expect(guideLinks()).toHaveLength(PAGES.length);
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

  it("make no claims we can't back up", () => {
    const text = JSON.stringify(PAGES).toLowerCase();
    for (const banned of ["100%", "risk free", "risk-free", "no mistakes", "guarantee", "#1", "best ai", "users love", "trusted by", "rated"]) {
      expect(text.includes(banned) && new RegExp(`(^|\\W)${banned.replace(/[#%-]/g, "\\$&")}(\\W|$)`).test(text), banned).toBe(false);
    }
  });

  it("template pages point at real templates", () => {
    const slugs = TEMPLATE_PAGES.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const page of TEMPLATE_PAGES) expect(templateFor(page).prompt).toBeTruthy();
  });
});

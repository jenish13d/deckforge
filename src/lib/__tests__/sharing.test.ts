import { describe, expect, it } from "vitest";

import { canView } from "../access";
import { shareLinks } from "../share";

describe("who can view a deck", () => {
  const deck = { userId: "owner", shared: true };

  it("lets anyone open a shared deck", () => {
    expect(canView(deck, null)).toBe(true);
    expect(canView(deck, "someone-else")).toBe(true);
  });

  it("shows a private deck to its owner only", () => {
    const priv = { ...deck, shared: false };
    expect(canView(priv, "owner")).toBe(true);
    expect(canView(priv, "someone-else")).toBe(false);
    expect(canView(priv, null)).toBe(false);
  });
});

describe("share links", () => {
  const links = shareLinks("https://slidezza.app/d/abc", "Pasta & Pizza: 100% Italian?");

  it("covers the usual apps", () => {
    expect(links.map((l) => l.id)).toEqual(["whatsapp", "telegram", "x", "linkedin", "facebook", "reddit", "email"]);
  });

  it("encodes the title and link safely", () => {
    for (const { href } of links) {
      expect(href).not.toContain(" ");
      expect(href).not.toContain("&P");
      expect(href).toContain(encodeURIComponent("https://slidezza.app/d/abc"));
    }
    const whatsapp = new URL(links[0].href);
    expect(whatsapp.searchParams.get("text")).toBe("Pasta & Pizza: 100% Italian? https://slidezza.app/d/abc");
  });
});

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ db: {} }));

import { buildTasks, digestEmail, todayTheme, type Hub } from "../hub";

const base = {
  totals: { users: 10, decks: 20, cards: 100, paying: 0, leads: 0, feedback: 0 },
  week: { users: 3, decks: 5, leads: 0, fromFiles: 1, feedback: 0 },
  idleUsers: 0,
  unmailedLeads: 0,
  billing: false,
  email: true,
};

describe("owner to-do list", () => {
  it("always starts with today's post, using the India-time weekday", () => {
    // 2026-10-07 is a Wednesday; at 20:00 UTC it is already Thursday in India.
    expect(todayTheme(new Date("2026-10-07T10:00:00Z"))).toMatch(/^Wednesday/);
    expect(todayTheme(new Date("2026-10-07T20:00:00Z"))).toMatch(/^Thursday/);
    expect(buildTasks(base, new Date("2026-10-07T10:00:00Z"))[0].text).toContain("Wednesday: pitch decks");
  });

  it("asks to set up payments while people wait, and to email them once payments are open", () => {
    const closed = buildTasks({ ...base, unmailedLeads: 3 });
    expect(closed.some((t) => t.text.includes("3 people want Pro or Max") && !t.href)).toBe(true);
    const open = buildTasks({ ...base, unmailedLeads: 1, billing: true });
    expect(open.some((t) => t.text.includes("1 person is waiting") && t.href === "/admin#leads")).toBe(true);
  });

  it("flags quiet weeks, idle sign-ups, feedback, missing email and no file-built decks", () => {
    const texts = buildTasks({
      ...base,
      week: { users: 0, decks: 0, leads: 0, fromFiles: 0, feedback: 2 },
      idleUsers: 4,
      email: false,
    }).map((t) => t.text);
    expect(texts.some((t) => t.includes("No new sign-ups this week"))).toBe(true);
    expect(texts.some((t) => t.includes("4 people signed up but never made a deck"))).toBe(true);
    expect(texts.some((t) => t.includes("2 new feedback messages"))).toBe(true);
    expect(texts.some((t) => t.includes("SMTP"))).toBe(true);
    expect(texts.some((t) => t.includes("from a file this week"))).toBe(true);
  });
});

describe("daily summary email", () => {
  it("lists the numbers, the latest leads and the to-do list, and escapes HTML", () => {
    const hub = {
      ...base,
      today: { users: 2, decks: 4, leads: 1 },
      leads: [{ email: "<b>x</b>@example.com", plan: "max", at: new Date(), told: false }],
      newUsers: [],
      feedback: [],
      series: [],
      tasks: [{ text: "Post today's content" }],
    } as unknown as Hub;
    const mail = digestEmail(hub);
    expect(mail.subject).toContain("2 new users, 1 new lead");
    expect(mail.text).toContain("<b>x</b>@example.com (Max)");
    expect(mail.html).not.toContain("<b>x</b>");
    expect(mail.text).toContain("Post today's content");
  });
});

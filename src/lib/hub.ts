import "server-only";

import { billingConfigured } from "./billing";
import { db } from "./db";
import { emailEnabled, escapeHtml } from "./email";
import { SITE } from "./site";
import { siteUrl } from "./url";

// The owner's marketing hub: numbers, leads and a short to-do list, shown on /admin and
// sent as a daily email. Counts only: other people's deck titles and prompts stay private.

const DAY = 24 * 60 * 60 * 1000;

export interface Task {
  text: string;
  /** Where to do it, if it's a page. */
  href?: string;
}

export interface Hub {
  totals: { users: number; decks: number; cards: number; paying: number; leads: number; feedback: number };
  today: { users: number; decks: number; leads: number };
  week: { users: number; decks: number; leads: number; fromFiles: number; feedback: number };
  /** Last 14 days, oldest first. */
  series: { day: string; users: number; decks: number }[];
  leads: { email: string; plan: string; at: Date; told: boolean }[];
  newUsers: { email: string; at: Date }[];
  feedback: { message: string; rating: number | null; email: string | null; at: Date }[];
  idleUsers: number;
  unmailedLeads: number;
  billing: boolean;
  email: boolean;
  tasks: Task[];
}

const THEMES = [
  "Sunday: plan the week and publish one long guide",
  "Monday: students and university",
  "Tuesday: business reports and meetings",
  "Wednesday: pitch decks and client proposals",
  "Thursday: teachers and lesson slides",
  "Friday: what you built this week",
  "Saturday: from a file to a deck",
];

/** What the daily agent is writing about today (India time). */
export const todayTheme = (now = new Date()) => THEMES[new Date(now.getTime() + 5.5 * 60 * 60 * 1000).getUTCDay()];

/** The short list of things worth doing, from the numbers. Pure, so it can be tested. */
export function buildTasks(h: Pick<Hub, "week" | "idleUsers" | "unmailedLeads" | "billing" | "email" | "totals">, now = new Date()): Task[] {
  const tasks: Task[] = [{ text: `Post today's content from the marketing agent (${todayTheme(now)})` }];
  if (h.unmailedLeads > 0) {
    tasks.push(
      h.billing
        ? { text: `${h.unmailedLeads} ${h.unmailedLeads === 1 ? "person is" : "people are"} waiting for Pro or Max. Paid plans are open: email the list.`, href: "/admin#leads" }
        : { text: `${h.unmailedLeads} ${h.unmailedLeads === 1 ? "person wants" : "people want"} Pro or Max. Set up payments (Vercel Pro and Stripe) so you can open it for them.` },
    );
  }
  if (h.week.users === 0) tasks.push({ text: "No new sign-ups this week. Answer two questions on Reddit or X with real help, and post the LinkedIn text." });
  if (h.idleUsers > 0) {
    tasks.push({ text: `${h.idleUsers} ${h.idleUsers === 1 ? "person signed up" : "people signed up"} but never made a deck. Check that the first screen is clear, and ask a friend to try it fresh.` });
  }
  if (h.week.feedback > 0) tasks.push({ text: `Read ${h.week.feedback} new feedback ${h.week.feedback === 1 ? "message" : "messages"} and reply to anyone who left an email.`, href: "/admin#feedback" });
  if (!h.email) tasks.push({ text: "Email isn't set up (SMTP), so no confirmations or summaries are sent." });
  if (h.totals.users > 0 && h.week.fromFiles === 0) tasks.push({ text: "Nobody built a deck from a file this week. Post the 'file to deck' video idea." });
  return tasks;
}

const startOfDay = (t: number) => Math.floor(t / DAY) * DAY;

async function perDay(table: "User" | "Deck", since: Date): Promise<Map<string, number>> {
  const rows =
    table === "User"
      ? await db.$queryRaw<{ d: Date; n: number }[]>`SELECT date_trunc('day', "createdAt") AS d, count(*)::int AS n FROM "User" WHERE "createdAt" >= ${since} GROUP BY 1`
      : await db.$queryRaw<{ d: Date; n: number }[]>`SELECT date_trunc('day', "createdAt") AS d, count(*)::int AS n FROM "Deck" WHERE "createdAt" >= ${since} GROUP BY 1`;
  return new Map(rows.map((r) => [r.d.toISOString().slice(0, 10), r.n]));
}

export async function loadHub(now = new Date()): Promise<Hub> {
  const t = now.getTime();
  const todayStart = new Date(startOfDay(t));
  const weekAgo = new Date(t - 7 * DAY);
  const since = new Date(startOfDay(t) - 13 * DAY);
  const fromFiles = { research: { sources: { contains: '"kind":"file"' } } };

  const [users, decks, cards, paying, leads, feedback, usersToday, decksToday, leadsToday, usersWeek, decksWeek, leadsWeek, filesWeek, feedbackWeek, idleUsers, unmailedLeads, userDays, deckDays, leadRows, userRows, feedbackRows] =
    await Promise.all([
      db.user.count(),
      db.deck.count(),
      db.card.count({ where: { status: "ready" } }),
      db.user.count({ where: { plan: { in: ["pro", "max"] } } }),
      db.proWaitlist.count(),
      db.feedback.count(),
      db.user.count({ where: { createdAt: { gte: todayStart } } }),
      db.deck.count({ where: { createdAt: { gte: todayStart } } }),
      db.proWaitlist.count({ where: { createdAt: { gte: todayStart } } }),
      db.user.count({ where: { createdAt: { gte: weekAgo } } }),
      db.deck.count({ where: { createdAt: { gte: weekAgo } } }),
      db.proWaitlist.count({ where: { createdAt: { gte: weekAgo } } }),
      db.deck.count({ where: { createdAt: { gte: weekAgo }, ...fromFiles } }),
      db.feedback.count({ where: { createdAt: { gte: weekAgo } } }),
      db.user.count({ where: { createdAt: { lt: new Date(t - DAY) }, decks: { none: {} } } }),
      db.proWaitlist.count({ where: { notifiedAt: null } }),
      perDay("User", since),
      perDay("Deck", since),
      db.proWaitlist.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      db.user.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { email: true, createdAt: true } }),
      db.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    ]);

  const series = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(since.getTime() + i * DAY).toISOString().slice(0, 10);
    return { day, users: userDays.get(day) ?? 0, decks: deckDays.get(day) ?? 0 };
  });

  const hub: Hub = {
    totals: { users, decks, cards, paying, leads, feedback },
    today: { users: usersToday, decks: decksToday, leads: leadsToday },
    week: { users: usersWeek, decks: decksWeek, leads: leadsWeek, fromFiles: filesWeek, feedback: feedbackWeek },
    series,
    leads: leadRows.map((l) => ({ email: l.email, plan: l.plan, at: l.createdAt, told: Boolean(l.notifiedAt) })),
    newUsers: userRows.map((u) => ({ email: u.email, at: u.createdAt })),
    feedback: feedbackRows.map((f) => ({ message: f.message, rating: f.rating, email: f.email, at: f.createdAt })),
    idleUsers,
    unmailedLeads,
    billing: billingConfigured(),
    email: emailEnabled(),
    tasks: [],
  };
  hub.tasks = buildTasks(hub, now);
  return hub;
}

/** The daily summary email. */
export function digestEmail(h: Hub): { subject: string; text: string; html: string } {
  const url = `${siteUrl()}/admin`;
  const subject = `${SITE.name} today: ${h.today.users} new ${h.today.users === 1 ? "user" : "users"}, ${h.today.leads} new ${h.today.leads === 1 ? "lead" : "leads"}`;
  const lines = [
    `New today: ${h.today.users} sign-ups, ${h.today.decks} decks, ${h.today.leads} Pro/Max leads.`,
    `This week: ${h.week.users} sign-ups, ${h.week.decks} decks (${h.week.fromFiles} built from files), ${h.week.leads} leads, ${h.week.feedback} feedback.`,
    `All time: ${h.totals.users} users, ${h.totals.decks} decks, ${h.totals.paying} paying, ${h.totals.leads} on the Pro/Max list.`,
  ];
  const leads = h.leads.slice(0, 5).map((l) => `${l.email} (${l.plan === "max" ? "Max" : "Pro"})`);
  const todo = h.tasks.map((t) => t.text);
  const text = `${lines.join("\n")}\n\n${leads.length ? `Latest leads:\n${leads.map((l) => `- ${l}`).join("\n")}\n\n` : ""}To do:\n${todo.map((t) => `- ${t}`).join("\n")}\n\nOpen the dashboard: ${url}`;
  const list = (items: string[]) => `<ul style="padding-left:20px">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#1d1d22;max-width:520px">
${lines.map((l) => `<p style="margin:0 0 8px">${escapeHtml(l)}</p>`).join("")}
${leads.length ? `<h3 style="margin:18px 0 4px">Latest leads</h3>${list(leads)}` : ""}
<h3 style="margin:18px 0 4px">To do</h3>${list(todo)}
<p><a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 18px;background:#0b3d6b;color:#fff;border-radius:8px;text-decoration:none">Open the dashboard</a></p>
</div>`;
  return { subject, text, html };
}

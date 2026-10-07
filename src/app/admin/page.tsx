import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app/AppShell";
import { isAdminEmail } from "@/lib/admin";
import { LaunchEmailButton } from "@/components/LaunchEmailButton";
import { getCurrentUser } from "@/lib/auth";
import { billingConfigured } from "@/lib/billing";
import { db } from "@/lib/db";
import { emailEnabled } from "@/lib/email";

export const metadata = { title: "Admin", robots: { index: false } };

const MOODS = ["😞", "😐", "🙂", "😍"];
const DAY = 24 * 60 * 60 * 1000;

async function loadAdminData() {
  const weekAgo = new Date(Date.now() - 7 * DAY);
  const [users, usersWeek, pro, decks, decksWeek, cards, feedbackCount, ratings, feedback, waitlist] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.user.count({ where: { plan: { in: ["pro", "max"] } } }),
    db.deck.count(),
    db.deck.count({ where: { createdAt: { gte: weekAgo } } }),
    db.card.count({ where: { status: "ready" } }),
    db.feedback.count(),
    db.feedback.groupBy({ by: ["rating"], _count: true }),
    db.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    db.proWaitlist.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
  ]);
  return { users, usersWeek, pro, decks, decksWeek, cards, feedbackCount, ratings, feedback, waitlist };
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) notFound();

  const { users, usersWeek, pro, decks, decksWeek, cards, feedbackCount, ratings, feedback, waitlist } = await loadAdminData();
  const rated = ratings.filter((r) => r.rating !== null);
  const ratedCount = rated.reduce((n, r) => n + r._count, 0);
  const average = ratedCount ? rated.reduce((n, r) => n + (r.rating ?? 0) * r._count, 0) / ratedCount : null;

  const stats = [
    { label: "Users", value: users, note: `+${usersWeek} this week` },
    { label: "Decks made", value: decks, note: `+${decksWeek} this week` },
    { label: "Cards written", value: cards, note: "all time" },
    { label: "Pro users", value: pro, note: "paying (or demo)" },
    { label: "Want Pro or Max", value: waitlist.length, note: "on the email list" },
    { label: "Feedback", value: feedbackCount, note: average ? `average ${MOODS[Math.round(average) - 1]} ${average.toFixed(1)}/4` : "no ratings yet" },
  ];

  return (
    <AppShell next="/admin">
      <div className="page">
        <h1 className="page-title">Admin</h1>
        <div className="admin-stats">
          {stats.map((s) => (
            <div key={s.label} className="admin-stat">
              <span className="muted small">{s.label}</span>
              <span className="admin-stat__value">{s.value.toLocaleString()}</span>
              <span className="muted small">{s.note}</span>
            </div>
          ))}
        </div>

        <h2 className="section-title">Pro and Max list</h2>
        <LaunchEmailButton
          waiting={waitlist.filter((w) => !w.notifiedAt).length}
          ready={billingConfigured() && emailEnabled()}
          why={!billingConfigured() ? "Set up payments first, so people can buy when they get the email." : !emailEnabled() ? "Set up email (SMTP) first." : ""}
        />
        {waitlist.length === 0 ? (
          <p className="muted">Nobody yet. People who click “Get Pro” or “Get Max” before payments open appear here.</p>
        ) : (
          <ul className="feedback-list">
            {waitlist.map((w) => (
              <li key={w.id} className="feedback-item row row--between">
                <a href={`mailto:${w.email}`}>{w.email}</a>
                <span className="muted small">
                  {w.plan === "max" ? "Max" : "Pro"} · {w.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  {w.notifiedAt ? " · emailed" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}

        <h2 className="section-title">Feedback</h2>
        {feedback.length === 0 ? (
          <p className="muted">No feedback yet. Share your link and it will appear here (and in your email).</p>
        ) : (
          <ul className="feedback-list">
            {feedback.map((f) => (
              <li key={f.id} className="feedback-item">
                <div className="row row--between">
                  <span className="feedback-item__mood" aria-label={f.rating ? `Rating ${f.rating} of 4` : "No rating"}>
                    {f.rating ? MOODS[f.rating - 1] : "–"}
                  </span>
                  <span className="muted small">
                    {f.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <p className="feedback-item__message">{f.message}</p>
                <p className="muted small">
                  {f.email ? <a href={`mailto:${f.email}`}>{f.email}</a> : "anonymous"} · {f.page}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

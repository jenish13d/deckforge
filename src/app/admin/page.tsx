import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app/AppShell";
import { DeleteAllAccounts } from "@/components/admin/DeleteAllAccounts";
import { ExampleManager } from "@/components/admin/ExampleManager";
import { InviteManager } from "@/components/admin/InviteManager";
import { OpenEmailButton } from "@/components/admin/OpenEmailButton";
import { adminEmails, isAdminEmail } from "@/lib/admin";
import { LaunchEmailButton } from "@/components/LaunchEmailButton";
import { SendDigestButton } from "@/components/SendDigestButton";
import { getCurrentUser } from "@/lib/auth";
import { emailEnabled } from "@/lib/email";
import { ownDecksForExamples } from "@/lib/examples";
import { loadHub } from "@/lib/hub";
import { countAccountsExceptAdmins, listInvites } from "@/lib/invites";
import { launchListSummary } from "@/lib/launch-list";
import { lockedCountries, prelaunchOn } from "@/lib/prelaunch";
import { siteUrl } from "@/lib/url";

export const metadata = { title: "Marketing hub", robots: { index: false } };

const MOODS = ["😞", "😐", "🙂", "😍"];

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) notFound();

  const prelaunch = prelaunchOn();
  const countries = lockedCountries();
  const [hub, invites, launchList, others, decks] = await Promise.all([loadHub(), listInvites(), launchListSummary(), countAccountsExceptAdmins(adminEmails()), ownDecksForExamples(user.id)]);
  // Fixed for this render, so the server and the browser show the same "hours left".
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const when = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const peak = Math.max(1, ...hub.series.flatMap((d) => [d.users, d.decks]));
  const ratings = hub.feedback.filter((f) => f.rating !== null);
  const average = ratings.length ? ratings.reduce((n, f) => n + (f.rating ?? 0), 0) / ratings.length : null;

  const stats = [
    { label: "New today", value: hub.today.users, note: `sign-ups · ${hub.today.decks} decks · ${hub.today.leads} leads` },
    { label: "Sign-ups this week", value: hub.week.users, note: `${hub.totals.users.toLocaleString()} users in all` },
    { label: "Decks this week", value: hub.week.decks, note: `${hub.week.fromFiles} built from files` },
    { label: "Want Pro or Max", value: hub.totals.leads, note: `+${hub.week.leads} this week` },
    { label: "Paying users", value: hub.totals.paying, note: "Pro and Max (or demo)" },
    { label: "Feedback", value: hub.totals.feedback, note: average ? `recent average ${MOODS[Math.round(average) - 1]} ${average.toFixed(1)}/4` : "no ratings yet" },
  ];

  return (
    <AppShell next="/admin">
      <div className="page hub">
        <h1 className="page-title">Marketing hub</h1>

        <h2 id="launch" className="section-title">{prelaunch ? "Before launch" : "Launch"}</h2>
        <p className="muted">
          {prelaunch
            ? "The site is locked: visitors see “launching soon” and can join the list. Only admins and invite codes can sign in. To launch, remove PRELAUNCH in Vercel and redeploy."
            : countries.length
              ? `The site is open everywhere except ${countries.join(", ")}: visitors from there see “launching soon”, and only admins and invite codes can sign in. To open there too, remove PRELAUNCH_COUNTRIES in Vercel and redeploy.`
              : "The site is open to everyone. To lock it again before launch, set PRELAUNCH=1 (or PRELAUNCH_COUNTRIES for some countries only) in Vercel and redeploy."}
        </p>

        <h3 className="section-subtitle">Invite codes</h3>
        <InviteManager
          invites={invites.map((i) => ({ id: i.id, code: i.code, note: i.note, expiresAt: i.expiresAt.toISOString(), usedAt: i.usedAt?.toISOString() ?? null, usedBy: i.usedBy }))}
          origin={siteUrl()}
          now={now}
        />

        <h3 className="section-subtitle">Launch list ({launchList.total})</h3>
        {launchList.recent.length === 0 ? (
          <p className="muted">Nobody yet. People who leave their email on the launching-soon page appear here.</p>
        ) : (
          <ul className="feedback-list">
            {launchList.recent.map((l) => (
              <li key={l.email} className="feedback-item row row--between">
                <a href={`mailto:${l.email}`}>{l.email}</a>
                <span className="muted small">
                  {when(l.createdAt)}
                  {l.notifiedAt ? " · emailed" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <OpenEmailButton
          waiting={launchList.waiting}
          ready={!prelaunch && emailEnabled()}
          why={prelaunch ? "Available after launch." : !emailEnabled() ? "Set up email (SMTP) first." : ""}
        />

        {prelaunch && (
          <>
            <h3 className="section-subtitle">Start fresh</h3>
            <DeleteAllAccounts count={others} />
          </>
        )}

        <h2 id="examples" className="section-title">Example pages</h2>
        <p className="muted">
          Publish your own finished decks at /examples so people searching for “[topic] presentation” find them. Make decks on topics people search for (school subjects, history, science), check them, then publish. Unpublished decks stay private.
        </p>
        <ExampleManager decks={decks} />

        <h2 className="section-title">To do today</h2>
        <ul className="hub__tasks">
          {hub.tasks.map((t) => (
            <li key={t.text}>{t.href ? <a href={t.href}>{t.text}</a> : t.text}</li>
          ))}
        </ul>

        <div className="admin-stats">
          {stats.map((s) => (
            <div key={s.label} className="admin-stat">
              <span className="muted small">{s.label}</span>
              <span className="admin-stat__value">{s.value.toLocaleString()}</span>
              <span className="muted small">{s.note}</span>
            </div>
          ))}
        </div>

        <h2 className="section-title">Last 14 days</h2>
        <div className="hub__chart" role="img" aria-label={`Sign-ups and decks per day for the last 14 days. Peak ${peak}.`}>
          {hub.series.map((d) => (
            <div key={d.day} className="hub__day" title={`${d.day}: ${d.users} sign-ups, ${d.decks} decks`}>
              <span className="hub__bars">
                <span className="hub__bar hub__bar--users" style={{ height: `${(d.users / peak) * 100}%` }} />
                <span className="hub__bar hub__bar--decks" style={{ height: `${(d.decks / peak) * 100}%` }} />
              </span>
              <span className="hub__label">{d.day.slice(8)}</span>
            </div>
          ))}
        </div>
        <p className="muted small hub__legend">
          <span className="hub__key hub__key--users" /> Sign-ups <span className="hub__key hub__key--decks" /> Decks made (days in UTC)
        </p>

        <h2 id="leads" className="section-title">Pro and Max list</h2>
        <LaunchEmailButton
          waiting={hub.unmailedLeads}
          ready={hub.billing && hub.email}
          why={!hub.billing ? "Set up payments first, so people can buy when they get the email." : !hub.email ? "Set up email (SMTP) first." : ""}
        />
        {hub.leads.length === 0 ? (
          <p className="muted">Nobody yet. People who click “Get Pro” or “Get Max” before payments open appear here.</p>
        ) : (
          <ul className="feedback-list">
            {hub.leads.map((l) => (
              <li key={l.email} className="feedback-item row row--between">
                <a href={`mailto:${l.email}`}>{l.email}</a>
                <span className="muted small">
                  {l.plan === "max" ? "Max" : "Pro"} · {when(l.at)}
                  {l.told ? " · emailed" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}

        <h2 className="section-title">Newest sign-ups</h2>
        {hub.newUsers.length === 0 ? (
          <p className="muted">No sign-ups yet.</p>
        ) : (
          <ul className="feedback-list">
            {hub.newUsers.map((u) => (
              <li key={u.email} className="feedback-item row row--between">
                <a href={`mailto:${u.email}`}>{u.email}</a>
                <span className="muted small">{when(u.at)}</span>
              </li>
            ))}
          </ul>
        )}

        <h2 id="feedback" className="section-title">Feedback</h2>
        {hub.feedback.length === 0 ? (
          <p className="muted">No feedback yet. Share your link and it will appear here (and in your email).</p>
        ) : (
          <ul className="feedback-list">
            {hub.feedback.map((f) => (
              <li key={f.at.toISOString() + f.message.slice(0, 12)} className="feedback-item">
                <div className="row row--between">
                  <span className="feedback-item__mood" aria-label={f.rating ? `Rating ${f.rating} of 4` : "No rating"}>
                    {f.rating ? MOODS[f.rating - 1] : "–"}
                  </span>
                  <span className="muted small">{when(f.at)}</span>
                </div>
                <p className="feedback-item__message">{f.message}</p>
                <p className="muted small">{f.email ? <a href={`mailto:${f.email}`}>{f.email}</a> : "anonymous"}</p>
              </li>
            ))}
          </ul>
        )}

        <h2 className="section-title">Daily summary and app</h2>
        <p className="muted">
          {process.env.CRON_SECRET
            ? "A summary email arrives every morning (about 9 AM India time)."
            : "To get a summary email every morning, add CRON_SECRET in Vercel (any long random text), then redeploy."}
        </p>
        <SendDigestButton ready={hub.email} />
        <p className="muted small">
          Install this page as an app on your laptop: open it in Microsoft Edge or Google Chrome, then choose the menu (⋯) → Apps → Install this site as an app.
          Firefox can&apos;t install web apps on a computer.
        </p>
      </div>
    </AppShell>
  );
}

import "server-only";

import { randomBytes } from "node:crypto";

import { db } from "./db";
import { emailEnabled, escapeHtml, sendEmail } from "./email";
import { SITE } from "./site";

// The "launching soon" list: one confirmation now and one email when the site opens. Every
// email has a link to leave the list, which deletes the entry.

const leaveLink = (origin: string, token: string) => `${origin}/launch/leave?token=${encodeURIComponent(token)}`;

function layout(paragraphs: string[], button: { href: string; label: string } | null, leave: string) {
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#1d1d22;max-width:480px">
${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n")}
${button ? `<p><a href="${escapeHtml(button.href)}" style="display:inline-block;padding:10px 18px;background:#0b3d6b;color:#fff;border-radius:8px;text-decoration:none">${escapeHtml(button.label)}</a></p>` : ""}
<p style="color:#6b6b73;font-size:13px">You're getting this because you asked to hear when ${SITE.name} opens. <a href="${escapeHtml(leave)}" style="color:#6b6b73">Leave the list</a>.</p>
</div>`;
  const text = `${paragraphs.join("\n\n")}${button ? `\n\n${button.label}: ${button.href}` : ""}\n\nLeave the list: ${leave}`;
  return { text, html };
}

export function launchConfirmationEmail(origin: string, token: string) {
  return {
    subject: `You're on the ${SITE.name} launch list`,
    ...layout([`Grazie! You're on the list. We'll send you one email when ${SITE.name} opens, and nothing else.`], null, leaveLink(origin, token)),
  };
}

export function openEmail(origin: string, token: string) {
  return {
    subject: `${SITE.name} is open`,
    ...layout(
      [`You asked us to tell you: ${SITE.name} is open now.`, `Describe your idea and get a planned, written and designed deck. The Free plan needs no card.`],
      { href: `${origin}/signup`, label: `Start with ${SITE.name}` },
      leaveLink(origin, token),
    ),
  };
}

/** Adds someone to the list (the same answer if they were already on it). Sends the confirmation the first time. */
export async function joinLaunchList(email: string, origin: string): Promise<{ created: boolean }> {
  if (await db.launchWaitlist.findUnique({ where: { email } })) return { created: false };
  const token = randomBytes(24).toString("base64url");
  try {
    await db.launchWaitlist.create({ data: { email, token } });
  } catch {
    // Joined twice at the same moment: they're on the list.
    return { created: false };
  }
  if (emailEnabled()) {
    const mail = launchConfirmationEmail(origin, token);
    await sendEmail(email, mail.subject, mail.text, mail.html).catch((error) => console.error("Launch list confirmation failed", error));
  }
  return { created: true };
}

export async function leaveLaunchList(token: string): Promise<boolean> {
  if (!token || token.length > 100) return false;
  return (await db.launchWaitlist.deleteMany({ where: { token } })).count === 1;
}

export async function launchListSummary() {
  const [total, waiting, recent] = await Promise.all([
    db.launchWaitlist.count(),
    db.launchWaitlist.count({ where: { notifiedAt: null } }),
    db.launchWaitlist.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { email: true, createdAt: true, notifiedAt: true } }),
  ]);
  return { total, waiting, recent };
}

/** Emails everyone not yet told that the site is open, in batches (Gmail allows about 500 a day). */
export async function sendOpenEmails(origin: string, batch = 40): Promise<{ sent: number; failed: number; left: number }> {
  const rows = await db.launchWaitlist.findMany({ where: { notifiedAt: null }, orderBy: { createdAt: "asc" }, take: batch });
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    const mail = openEmail(origin, row.token);
    try {
      await sendEmail(row.email, mail.subject, mail.text, mail.html);
      await db.launchWaitlist.update({ where: { id: row.id }, data: { notifiedAt: new Date() } });
      sent++;
    } catch (error) {
      console.error("Open email failed", error);
      failed++;
    }
  }
  return { sent, failed, left: await db.launchWaitlist.count({ where: { notifiedAt: null } }) };
}

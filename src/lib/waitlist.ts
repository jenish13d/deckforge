import "server-only";

import { randomBytes } from "node:crypto";

import { db } from "./db";
import { emailEnabled, escapeHtml, sendEmail } from "./email";
import { PLANS, type PaidPlanId } from "./plans";
import { SITE } from "./site";

// The Pro list: while payments aren't open, "Get Pro" / "Get Max" collect an email instead.
// Each person gets a confirmation now and one email when paid plans open; every email has
// a link to leave the list.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizeEmail = (value: unknown) => (typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "");
export const isEmail = (value: string) => EMAIL.test(value);

const leaveLink = (origin: string, token: string) => `${origin}/pro/leave?token=${encodeURIComponent(token)}`;

function layout(paragraphs: string[], button: { href: string; label: string } | null, leave: string) {
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#1d1d22;max-width:480px">
${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n")}
${button ? `<p><a href="${escapeHtml(button.href)}" style="display:inline-block;padding:10px 18px;background:#0b3d6b;color:#fff;border-radius:8px;text-decoration:none">${escapeHtml(button.label)}</a></p>` : ""}
<p style="color:#6b6b73;font-size:13px">You're getting this because you asked to hear when ${SITE.name}'s paid plans open. <a href="${escapeHtml(leave)}" style="color:#6b6b73">Leave the list</a>.</p>
</div>`;
  const text = `${paragraphs.join("\n\n")}${button ? `\n\n${button.label}: ${button.href}` : ""}\n\nLeave the list: ${leave}`;
  return { text, html };
}

export function confirmationEmail(plan: PaidPlanId, origin: string, token: string) {
  const name = PLANS[plan].label;
  return {
    subject: `You're on the ${SITE.name} ${name} list`,
    ...layout(
      [
        `Grazie! You're on the list for ${SITE.name} ${name} (${PLANS[plan].price}, ${PLANS[plan].monthlyCredits.toLocaleString("en-US")} credits a month).`,
        `We'll send you one email when it opens. Until then the Free plan keeps working: ${PLANS.free.monthlyCredits} credits every month.`,
      ],
      { href: origin, label: `Open ${SITE.name}` },
      leaveLink(origin, token),
    ),
  };
}

export function launchEmail(plan: PaidPlanId, origin: string, token: string) {
  const name = PLANS[plan].label;
  return {
    subject: `${SITE.name} ${name} is open`,
    ...layout(
      [
        `You asked us to tell you: ${SITE.name} ${name} is open now.`,
        `${name} is ${PLANS[plan].price} with ${PLANS[plan].monthlyCredits.toLocaleString("en-US")} credits a month, PowerPoint download, all detail levels and no badge. Cancel any time from your account.`,
      ],
      { href: `${origin}/account#upgrade`, label: `Get ${name}` },
      leaveLink(origin, token),
    ),
  };
}

/** Adds (or updates) someone on the list. Sends the confirmation the first time. */
export async function joinWaitlist(email: string, plan: PaidPlanId, origin: string): Promise<{ created: boolean }> {
  const existing = await db.proWaitlist.findUnique({ where: { email } });
  if (existing) {
    if (existing.plan !== plan) await db.proWaitlist.update({ where: { email }, data: { plan } });
    return { created: false };
  }
  const token = randomBytes(24).toString("base64url");
  await db.proWaitlist.create({ data: { email, plan, token } });
  // Keep the old flag in step for accounts, so the account page knows.
  await db.user.updateMany({ where: { email, proWaitlistAt: null }, data: { proWaitlistAt: new Date() } });

  if (emailEnabled()) {
    const mail = confirmationEmail(plan, origin, token);
    await sendEmail(email, mail.subject, mail.text, mail.html).catch((error) => console.error("Waitlist confirmation failed", error));
    if (SITE.contactEmail) {
      const total = await db.proWaitlist.count();
      const note = `${email} wants ${PLANS[plan].label}. ${total} ${total === 1 ? "person is" : "people are"} on the list now.`;
      await sendEmail(SITE.contactEmail, `Someone wants ${SITE.name} ${PLANS[plan].label}`, note, `<p>${escapeHtml(note)}</p>`).catch(
        (error) => console.error("Waitlist owner note failed", error),
      );
    }
  }
  return { created: true };
}

export async function leaveWaitlist(token: string): Promise<boolean> {
  if (!token || token.length > 100) return false;
  const row = await db.proWaitlist.findUnique({ where: { token } });
  if (!row) return false;
  await db.proWaitlist.delete({ where: { token } });
  await db.user.updateMany({ where: { email: row.email }, data: { proWaitlistAt: null } });
  return true;
}

export async function onWaitlist(email: string): Promise<PaidPlanId | null> {
  const row = await db.proWaitlist.findUnique({ where: { email: email.toLowerCase() }, select: { plan: true } });
  return row ? (row.plan === "max" ? "max" : "pro") : null;
}

/**
 * Emails everyone not yet told that paid plans are open, in batches (Gmail allows about
 * 500 a day). People who already pay are skipped and marked as told.
 */
export async function sendLaunchEmails(origin: string, { maxOpen = false, batch = 40 }: { maxOpen?: boolean; batch?: number } = {}): Promise<{ sent: number; failed: number; left: number }> {
  const rows = await db.proWaitlist.findMany({ where: { notifiedAt: null }, orderBy: { createdAt: "asc" }, take: batch });
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    const user = await db.user.findUnique({ where: { email: row.email }, select: { plan: true } });
    if (user && user.plan !== "free") {
      await db.proWaitlist.update({ where: { id: row.id }, data: { notifiedAt: new Date() } });
      continue;
    }
    // Until Max can be bought, people who asked for Max hear that Pro is open.
    const plan: PaidPlanId = row.plan === "max" && maxOpen ? "max" : "pro";
    const mail = launchEmail(plan, origin, row.token);
    try {
      await sendEmail(row.email, mail.subject, mail.text, mail.html);
      await db.proWaitlist.update({ where: { id: row.id }, data: { notifiedAt: new Date() } });
      sent++;
    } catch (error) {
      console.error("Launch email failed", error);
      failed++;
    }
  }
  const left = await db.proWaitlist.count({ where: { notifiedAt: null } });
  return { sent, failed, left };
}

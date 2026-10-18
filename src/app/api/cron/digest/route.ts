import { timingSafeEqual } from "node:crypto";

import { emailEnabled, sendEmail } from "@/lib/email";
import { digestEmail, loadHub } from "@/lib/hub";
import { deleteExpired } from "@/lib/invites";
import { jsonError } from "@/lib/http";
import { SITE } from "@/lib/site";

export const maxDuration = 30;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/** Vercel calls this once a day (see vercel.json): deletes ended invite accounts, then sends the owner the daily summary. */
export async function GET(request: Request) {
  if (!authorized(request)) return jsonError("Not found.", 404);
  await deleteExpired();
  if (!emailEnabled() || !SITE.contactEmail) return Response.json({ ok: false, reason: "email is not set up" });
  const mail = digestEmail(await loadHub());
  await sendEmail(SITE.contactEmail, mail.subject, mail.text, mail.html);
  return Response.json({ ok: true });
}

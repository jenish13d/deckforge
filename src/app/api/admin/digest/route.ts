import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { emailEnabled, sendEmail } from "@/lib/email";
import { digestEmail, loadHub } from "@/lib/hub";
import { jsonError, unauthorized } from "@/lib/http";

/** The owner presses a button to get today's summary by email right now. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!isAdminEmail(user.email)) return jsonError("Not found.", 404);
  if (!emailEnabled()) return jsonError("Set up email (SMTP) first.", 400);
  const mail = digestEmail(await loadHub());
  await sendEmail(user.email, mail.subject, mail.text, mail.html);
  return Response.json({ ok: true });
}

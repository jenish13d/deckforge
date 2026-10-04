import { db } from "@/lib/db";
import { emailEnabled, passwordResetEmail, sendEmail } from "@/lib/email";
import { jsonError, readJson } from "@/lib/http";
import { createResetToken } from "@/lib/password-reset";
import { clientKey, limits } from "@/lib/rate-limit";
import { SITE } from "@/lib/site";

export async function POST(request: Request) {
  if (!emailEnabled()) {
    const contact = SITE.contactEmail ? ` Email ${SITE.contactEmail} and we'll help.` : "";
    return jsonError(`Password reset by email isn't available yet.${contact}`, 503);
  }
  if (!limits.auth(clientKey(request))) return jsonError("Too many attempts. Try again later.", 429);

  const email = String((await readJson(request))?.email ?? "").trim().toLowerCase();
  const user = email ? await db.user.findUnique({ where: { email }, select: { id: true, email: true } }) : null;

  if (user) {
    const token = await createResetToken(user.id);
    const origin = process.env.APP_URL || new URL(request.url).origin;
    const message = passwordResetEmail(`${origin}/reset-password?token=${encodeURIComponent(token)}`);
    try {
      await sendEmail(user.email, message.subject, message.text, message.html);
    } catch (error) {
      console.error("Password reset email failed", error);
      return jsonError("We couldn't send the email. Please try again later.", 502);
    }
  }
  // Same answer whether or not the account exists, so this can't be used to find accounts.
  return Response.json({ ok: true });
}

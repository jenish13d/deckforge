import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { billingConfigured, maxConfigured } from "@/lib/billing";
import { emailEnabled } from "@/lib/email";
import { jsonError, unauthorized } from "@/lib/http";
import { sendLaunchEmails } from "@/lib/waitlist";

export const maxDuration = 60;

/** The owner tells the list that paid plans are open (one email each, sent once). */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!isAdminEmail(user.email)) return jsonError("Not found.", 404);
  if (!billingConfigured()) return jsonError("Set up payments first, so people can actually buy.", 400);
  if (!emailEnabled()) return jsonError("Set up email (SMTP) first.", 400);
  const origin = process.env.APP_URL || new URL(request.url).origin;
  return Response.json(await sendLaunchEmails(origin, { maxOpen: maxConfigured() }));
}

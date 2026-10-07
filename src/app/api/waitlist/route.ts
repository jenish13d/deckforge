import { getCurrentUser } from "@/lib/auth";
import { CAPTCHA_ERROR, verifyCaptcha } from "@/lib/captcha";
import { billingConfigured } from "@/lib/billing";
import { jsonError, readJson } from "@/lib/http";
import { isPaidPlan } from "@/lib/plans";
import { clientKey, limits } from "@/lib/rate-limit";
import { isEmail, joinWaitlist, normalizeEmail } from "@/lib/waitlist";

// "Get Pro" / "Get Max" while payments aren't open: join the list with an email.
export async function POST(request: Request) {
  if (billingConfigured()) return jsonError("Paid plans are open now: upgrade from your account.", 400);
  if (!limits.waitlist(clientKey(request))) return jsonError("Too many requests. Try again later.", 429);

  const body = await readJson(request);
  // Bots fill every field; people never see this one.
  if (typeof body?.website === "string" && body.website) return Response.json({ ok: true });
  const plan = isPaidPlan(body?.plan) ? body.plan : "pro";
  const user = await getCurrentUser();
  const email = user ? user.email.toLowerCase() : normalizeEmail(body?.email);
  if (!isEmail(email)) return jsonError("Enter a valid email address.", 400);
  // Visitors without an account prove they're human; signed-in users already did.
  if (!user && !(await verifyCaptcha(body?.altcha))) return jsonError(CAPTCHA_ERROR, 400);

  const origin = process.env.APP_URL || new URL(request.url).origin;
  await joinWaitlist(email, plan, origin);
  // The same answer whether or not the email was already on the list.
  return Response.json({ ok: true });
}

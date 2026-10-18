import { CAPTCHA_ERROR, verifyCaptcha } from "@/lib/captcha";
import { jsonError, readJson } from "@/lib/http";
import { joinLaunchList } from "@/lib/launch-list";
import { clientKey, limits } from "@/lib/rate-limit";
import { isEmail, normalizeEmail } from "@/lib/waitlist";

// "Tell me when it opens" on the launching-soon page.
export async function POST(request: Request) {
  if (!limits.waitlist(clientKey(request))) return jsonError("Too many requests. Try again later.", 429);
  const body = await readJson(request);
  // Bots fill every field; people never see this one.
  if (typeof body?.website === "string" && body.website) return Response.json({ ok: true });
  const email = normalizeEmail(body?.email);
  if (!isEmail(email)) return jsonError("Enter a valid email address.", 400);
  if (!(await verifyCaptcha(body?.altcha))) return jsonError(CAPTCHA_ERROR, 400);
  const origin = process.env.APP_URL || new URL(request.url).origin;
  await joinLaunchList(email, origin);
  // The same answer whether or not the email was already on the list.
  return Response.json({ ok: true });
}

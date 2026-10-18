import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { emailEnabled } from "@/lib/email";
import { jsonError, unauthorized } from "@/lib/http";
import { sendOpenEmails } from "@/lib/launch-list";
import { prelaunchOn } from "@/lib/prelaunch";

export const maxDuration = 60;

/** After launch: tells the launch list the site is open (one email each, sent once). */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) return unauthorized();
  if (prelaunchOn()) return jsonError("Launch first: remove PRELAUNCH in Vercel and redeploy.", 400);
  if (!emailEnabled()) return jsonError("Set up email (SMTP) first.", 400);
  const origin = process.env.APP_URL || new URL(request.url).origin;
  return Response.json(await sendOpenEmails(origin));
}

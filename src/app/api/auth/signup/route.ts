import { Prisma } from "@prisma/client";
import { after } from "next/server";

import { isAdminEmail } from "@/lib/admin";
import { trackServer } from "@/lib/analytics";
import { startSession } from "@/lib/auth";
import { CAPTCHA_ERROR, verifyCaptcha } from "@/lib/captcha";
import { allowance } from "@/lib/credits";
import { db } from "@/lib/db";
import { signUpWithInvite } from "@/lib/invites";
import { jsonError, readJson } from "@/lib/http";
import { hashPassword, validateCredentials } from "@/lib/password";
import { prelaunchOn } from "@/lib/prelaunch";
import { clientKey, limits } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!limits.auth(clientKey(request))) return jsonError("Too many attempts. Try again later.", 429);
  const body = await readJson(request);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const invalid = validateCredentials(email, password);
  if (invalid) return jsonError(invalid, 400);
  if (!(await verifyCaptcha(body?.altcha))) return jsonError(CAPTCHA_ERROR, 400);

  // Before launch only admins sign up freely; everyone else needs an invite code, and gets a one-day account.
  const invited = prelaunchOn() && !isAdminEmail(email);
  if (invited && !body?.code) return jsonError("We're not open yet. You need an invite code to sign up.", 403);

  try {
    const passwordHash = await hashPassword(password);
    const user = invited
      ? await signUpWithInvite(body?.code, email, passwordHash)
      : await db.user.create({ data: { email, passwordHash, plan: "free", ...allowance("free") } });
    if (!user) return jsonError("That invite code is wrong, already used or more than a day old.", 400);
    await startSession(user.id);
    after(() => trackServer(request, user.id, "signed_up"));
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("An account with this email already exists. Log in instead.", 409);
    }
    throw error;
  }
}

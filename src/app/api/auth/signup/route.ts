import { Prisma } from "@prisma/client";

import { startSession } from "@/lib/auth";
import { CAPTCHA_ERROR, verifyCaptcha } from "@/lib/captcha";
import { allowance } from "@/lib/credits";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { hashPassword, validateCredentials } from "@/lib/password";
import { clientKey, limits } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!limits.auth(clientKey(request))) return jsonError("Too many attempts. Try again later.", 429);
  const body = await readJson(request);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const invalid = validateCredentials(email, password);
  if (invalid) return jsonError(invalid, 400);
  if (!(await verifyCaptcha(body?.altcha))) return jsonError(CAPTCHA_ERROR, 400);

  try {
    const user = await db.user.create({
      data: { email, passwordHash: await hashPassword(password), plan: "free", ...allowance("free") },
    });
    await startSession(user.id);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("An account with this email already exists. Log in instead.", 409);
    }
    throw error;
  }
}

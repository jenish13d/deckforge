import { startSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import { clientKey, limits } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!limits.auth(clientKey(request))) return jsonError("Too many attempts. Try again later.", 429);
  const body = await readJson(request);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  const user = email ? await db.user.findUnique({ where: { email } }) : null;
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return jsonError("Wrong email or password.", 401);
  }
  await startSession(user.id, { remember: body?.remember !== false });
  return Response.json({ ok: true });
}

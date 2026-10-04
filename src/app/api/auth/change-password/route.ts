import { endAllSessions, getCurrentUser, startSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, readJson, unauthorized } from "@/lib/http";
import { hashPassword, validateCredentials, verifyPassword } from "@/lib/password";
import { clientKey, limits } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!limits.auth(clientKey(request))) return jsonError("Too many attempts. Try again later.", 429);

  const body = await readJson(request);
  const current = String(body?.current ?? "");
  const next = String(body?.next ?? "");
  if (!(await verifyPassword(current, user.passwordHash))) return jsonError("Your current password is wrong.", 400);
  const invalid = validateCredentials(user.email, next);
  if (invalid) return jsonError(invalid, 400);

  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  // Sign out other devices, keep this one signed in.
  await endAllSessions(user.id);
  await startSession(user.id);
  return Response.json({ ok: true });
}

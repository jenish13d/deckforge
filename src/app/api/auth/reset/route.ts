import { endAllSessions, startSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { hashPassword, validateCredentials } from "@/lib/password";
import { consumeResetToken } from "@/lib/password-reset";
import { clientKey, limits } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!limits.auth(clientKey(request))) return jsonError("Too many attempts. Try again later.", 429);
  const body = await readJson(request);
  const token = String(body?.token ?? "");
  const password = String(body?.password ?? "");
  const invalid = validateCredentials("user@example.com", password);
  if (invalid) return jsonError(invalid, 400);

  const userId = await consumeResetToken(token);
  if (!userId) return jsonError("This reset link is invalid or has expired. Ask for a new one.", 400);

  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } });
  await endAllSessions(userId);
  await startSession(userId);
  return Response.json({ ok: true });
}

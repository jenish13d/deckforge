import { endSession, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, readJson, unauthorized } from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import { clientKey, limits } from "@/lib/rate-limit";

/** Deletes the account and everything in it (decks, sessions). Needs the password. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!limits.auth(clientKey(request))) return jsonError("Too many attempts. Try again later.", 429);
  const body = await readJson(request);
  if (!(await verifyPassword(String(body?.password ?? ""), user.passwordHash))) return jsonError("That password is wrong.", 400);

  // Decks, cards, sessions and reset links are removed with the user; feedback stays, unlinked.
  await db.user.delete({ where: { id: user.id } });
  await endSession();
  return Response.json({ ok: true });
}

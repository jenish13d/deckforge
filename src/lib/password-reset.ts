import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { db } from "./db";

const RESET_MINUTES = 60;
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Creates a one-time reset token for the user (older ones stop working). */
export async function createResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.$transaction([
    db.passwordReset.deleteMany({ where: { userId } }),
    db.passwordReset.create({
      data: { id: hash(token), userId, expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000) },
    }),
  ]);
  return token;
}

/** Marks the token used and returns its user, or null if it's unknown, used or expired. */
export async function consumeResetToken(token: string): Promise<string | null> {
  if (!token) return null;
  const { count } = await db.passwordReset.updateMany({
    where: { id: hash(token), usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (count !== 1) return null;
  const reset = await db.passwordReset.findUnique({ where: { id: hash(token) }, select: { userId: true } });
  return reset?.userId ?? null;
}

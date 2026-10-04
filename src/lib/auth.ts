import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import type { User } from "@prisma/client";

import { refreshCredits } from "./credits";
import { db } from "./db";

const COOKIE = "df_session";
const SESSION_DAYS = 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Creates a session and sets the cookie. Call from a route handler or server action. */
export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  // Secure (HTTPS-only) everywhere except plain-HTTP localhost, where Safari would drop it.
  const host = (await headers()).get("host") ?? "";
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !local,
    path: "/",
    expires: expiresAt,
  });
}

/** Signs the user out everywhere (after a password change or reset). */
export async function endAllSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  store.delete(COOKIE);
}

/** The signed-in user (with credits refilled if their month rolled over), or null. */
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { id: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  return refreshCredits(session.user);
}

import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import type { User } from "@prisma/client";

import { isAdminEmail } from "./admin";
import { refreshCredits } from "./credits";
import { db } from "./db";
import { accountAllowed, lockedFor } from "./prelaunch";

const COOKIE = "df_session";
const SESSION_DAYS = 30;
// Without "Remember me" the cookie ends when the browser closes, and the session within a day.
const SHORT_SESSION_HOURS = 24;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Creates a session and sets the cookie. Call from a route handler or server action.
 * `remember: false` makes it a browser-session cookie that also expires within a day.
 */
export async function startSession(userId: string, { remember = true }: { remember?: boolean } = {}): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + (remember ? SESSION_DAYS * 24 : SHORT_SESSION_HOURS) * 60 * 60 * 1000);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  // Secure (HTTPS-only) everywhere except plain-HTTP localhost, where Safari would drop it.
  const host = (await headers()).get("host") ?? "";
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !local,
    path: "/",
    ...(remember ? { expires: expiresAt } : {}),
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

/**
 * Whether this account may be signed in now (see prelaunch.ts). An invite account that has ended
 * is deleted here, with its decks, so it is gone at once rather than at the next daily clean-up.
 */
export async function mayUseAccount(user: User, country: string | null, now = new Date()): Promise<boolean> {
  if (accountAllowed(user, { admin: isAdminEmail(user.email), prelaunch: lockedFor(country), now })) return true;
  if (user.expiresAt && user.expiresAt <= now) await db.user.deleteMany({ where: { id: user.id } });
  return false;
}

/** The signed-in user (with credits refilled if their month rolled over), or null. */
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { id: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  if (!(await mayUseAccount(session.user, (await headers()).get("x-vercel-ip-country")))) return null;
  return refreshCredits(session.user);
}

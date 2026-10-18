import "server-only";

import { randomBytes } from "node:crypto";
import { Prisma, type User } from "@prisma/client";

import { allowance } from "./credits";
import { db } from "./db";
import { inviteAccountExpiry, inviteExpiry, makeCode, normalizeCode } from "./prelaunch";

// Invite codes and the accounts they make (see prelaunch.ts for the rules).

export interface InviteView {
  id: string;
  code: string;
  note: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
  usedBy: string | null;
}

export async function createInvite(note: string): Promise<InviteView> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.invite.create({ data: { code: makeCode(randomBytes(8)), note: note.trim().slice(0, 80), expiresAt: inviteExpiry() } });
    } catch (error) {
      // A code that already exists (very unlikely): draw another.
      if (attempt < 3 && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
}

export const listInvites = (): Promise<InviteView[]> => db.invite.findMany({ orderBy: { createdAt: "desc" }, take: 30 });

/** Removes a code nobody has used yet. */
export async function revokeInvite(id: string): Promise<boolean> {
  return (await db.invite.deleteMany({ where: { id, usedAt: null } })).count === 1;
}

/**
 * Makes an account with an invite code, in one transaction: the code is used up only if the
 * account is made, and two people can't use the same code. Returns null for a wrong, used or
 * expired code. A taken email throws Prisma's P2002, as a normal sign-up does.
 */
export async function signUpWithInvite(code: unknown, email: string, passwordHash: string, now = new Date()): Promise<User | null> {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  return db.$transaction(async (tx) => {
    const claimed = await tx.invite.updateMany({ where: { code: normalized, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now, usedBy: email } });
    if (claimed.count !== 1) return null;
    // Someone whose earlier invite account has ended (but isn't cleaned up yet) can use the same email again.
    await tx.user.deleteMany({ where: { email, expiresAt: { lte: now } } });
    const user = await tx.user.create({ data: { email, passwordHash, plan: "free", ...allowance("free", now), expiresAt: inviteAccountExpiry(now) } });
    await tx.invite.update({ where: { code: normalized }, data: { userId: user.id } });
    return user;
  });
}

/** Deletes invite accounts that have ended (with their decks) and codes that are past use. Runs daily and on sign-in. */
export async function deleteExpired(now = new Date()): Promise<{ accounts: number; invites: number }> {
  const accounts = (await db.user.deleteMany({ where: { expiresAt: { lte: now } } })).count;
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const invites = (await db.invite.deleteMany({ where: { OR: [{ usedAt: null, expiresAt: { lte: now } }, { usedAt: { lte: weekAgo } }] } })).count;
  return { accounts, invites };
}

/**
 * Before launch: deletes every account except the admins' (with their decks). The waitlists and
 * feedback are kept (feedback loses its link to the account). Returns how many were deleted.
 */
export async function deleteAllAccountsExceptAdmins(admins: string[]): Promise<number> {
  if (admins.length === 0) throw new Error("No admin email is set, so every account would be deleted.");
  return (await db.user.deleteMany({ where: { email: { notIn: admins } } })).count;
}

export const countAccountsExceptAdmins = (admins: string[]) => db.user.count({ where: { email: { notIn: admins } } });

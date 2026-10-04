import type { User } from "@prisma/client";

import { db } from "./db";
import { CREDIT_PERIOD_MS, PLANS, planOf } from "./plans";

/** Fields for a fresh monthly allowance on the given plan. */
export function allowance(plan: string, now = new Date()) {
  return {
    credits: PLANS[planOf(plan)].monthlyCredits,
    creditsResetAt: new Date(now.getTime() + CREDIT_PERIOD_MS),
  };
}

/** Refills the user's credits if their period has ended. Unused credits don't roll over. */
export async function refreshCredits(user: User, now = new Date()): Promise<User> {
  if (user.creditsResetAt > now) return user;
  return db.user.update({ where: { id: user.id }, data: allowance(user.plan, now) });
}

/** Takes `amount` credits if the user has enough. Atomic, so parallel requests can't overspend. */
export async function chargeCredits(userId: string, amount: number): Promise<boolean> {
  const { count } = await db.user.updateMany({
    where: { id: userId, credits: { gte: amount } },
    data: { credits: { decrement: amount } },
  });
  return count === 1;
}

export async function refundCredits(userId: string, amount: number): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { credits: { increment: amount } } });
}

export async function creditsOf(userId: string): Promise<number> {
  return (await db.user.findUniqueOrThrow({ where: { id: userId }, select: { credits: true } })).credits;
}

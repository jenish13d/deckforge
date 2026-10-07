import type { User } from "@prisma/client";

import { db } from "./db";
import { CREDIT_PERIOD_MS, PLANS, planOf } from "./plans";

/**
 * Fields for a new monthly allowance on the given plan. Plans with rollover (Max) keep
 * unused credits, up to `rollover` months' worth in total; others start again from the allowance.
 */
export function allowance(plan: string, now = new Date(), unused = 0) {
  const { monthlyCredits, rollover } = PLANS[planOf(plan)];
  return {
    credits: Math.min(monthlyCredits + Math.max(0, unused), monthlyCredits * rollover),
    creditsResetAt: new Date(now.getTime() + CREDIT_PERIOD_MS),
  };
}

/** Refills the user's credits if their period has ended. */
export async function refreshCredits(user: User, now = new Date()): Promise<User> {
  if (user.creditsResetAt > now) return user;
  return db.user.update({ where: { id: user.id }, data: allowance(user.plan, now, user.credits) });
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

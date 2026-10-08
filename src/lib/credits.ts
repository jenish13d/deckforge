import type { Prisma, User } from "@prisma/client";

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

/** What the ledger functions need from a Prisma client or transaction. */
type Ledger = Pick<Prisma.TransactionClient, "user" | "creditLedger">;

/**
 * Takes the job's credits and records the charge. Call it inside the same transaction that
 * creates the job, so a charge never exists without its job. Returns false (and takes nothing)
 * when the user can't afford it. The balance check and the decrement are one statement, so
 * parallel requests can't overspend.
 */
export async function chargeForJob(tx: Ledger, userId: string, amount: number): Promise<boolean> {
  const { count } = await tx.user.updateMany({
    where: { id: userId, credits: { gte: amount } },
    data: { credits: { decrement: amount } },
  });
  return count === 1;
}

/**
 * Gives a job's credits back, once. The ledger's unique (job, type) key means a second refund
 * for the same job inserts nothing, and the balance only moves when the row was inserted.
 * Call it inside a transaction. Returns whether credits were actually returned.
 */
export async function refundJobCredits(tx: Ledger, job: { id: string; userId: string; cost: number }, reason: string): Promise<boolean> {
  const { count } = await tx.creditLedger.createMany({
    data: [{ userId: job.userId, jobId: job.id, amount: job.cost, type: "refund", reason }],
    skipDuplicates: true,
  });
  if (count !== 1) return false;
  await tx.user.update({ where: { id: job.userId }, data: { credits: { increment: job.cost } } });
  return true;
}

export async function creditsOf(userId: string): Promise<number> {
  return (await db.user.findUniqueOrThrow({ where: { id: userId }, select: { credits: true } })).credits;
}

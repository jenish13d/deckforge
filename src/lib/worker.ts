import "server-only";

import { db } from "./db";
import { claimNext, hasDueJobs, processJob, recoverStale } from "./jobs";
import { parallelCards } from "./providers";

// The loop that turns waiting jobs into written cards. It runs wherever the dispatcher
// (job-dispatch.ts) starts it, and stops claiming new jobs when its time budget is nearly
// spent: whatever is left is picked up by another worker.

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** How long one worker keeps taking new jobs (seconds). Routes run for at most 60 s. */
export const workerBudgetMs = () => Math.max(5, Number(process.env.JOB_WORKER_SECONDS) || 35) * 1000;

export interface WorkerOptions {
  /** No new job is started after this time (ms since epoch). */
  deadline: number;
  /** Called when work is left over after the deadline, so another worker can take it. */
  onMore?: (userId: string) => void | Promise<void>;
}

/** One worker for one user: claims and runs jobs one after another until none is runnable. */
export async function workerLoop(userId: string, { deadline }: Pick<WorkerOptions, "deadline">): Promise<number> {
  let processed = 0;
  while (Date.now() < deadline) {
    const job = await claimNext(userId);
    if (!job) {
      // Nothing runnable now. A retry that comes due soon is worth waiting for.
      const next = await db.generationJob.findFirst({ where: { userId, status: "queued" }, orderBy: { runAfter: "asc" }, select: { runAfter: true } });
      const wait = next ? next.runAfter.getTime() - Date.now() : -1;
      if (next && wait > 0 && Date.now() + wait < deadline) {
        await sleep(wait);
        continue;
      }
      break;
    }
    await processJob(job);
    processed++;
  }
  return processed;
}

/** Works through one user's jobs with as many parallel workers as their plan allows. */
export async function drainUser(userId: string, options: WorkerOptions): Promise<number> {
  await recoverStale({ userId });
  const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } });
  if (!user) return 0;
  const counts = await Promise.all(Array.from({ length: parallelCards(user.plan) }, () => workerLoop(userId, options)));
  // Out of time with jobs still due: hand over to a fresh worker.
  if (Date.now() >= options.deadline && (await hasDueJobs(userId))) await options.onMore?.(userId);
  return counts.reduce((a, b) => a + b, 0);
}

/** Works through every user's due jobs (the cron and the worker endpoint). */
export async function drainAll(options: WorkerOptions): Promise<number> {
  await recoverStale();
  const due = await db.generationJob.findMany({
    where: { status: "queued", runAfter: { lte: new Date() } },
    distinct: ["userId"],
    select: { userId: true },
    take: 25,
  });
  const counts = await Promise.all(due.map(({ userId }) => drainUser(userId, options)));
  return counts.reduce((a, b) => a + b, 0);
}

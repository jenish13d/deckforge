import "server-only";

import { timingSafeEqual } from "node:crypto";

import { after } from "next/server";

import { siteUrl } from "./url";
import { drainAll, drainUser, workerBudgetMs } from "./worker";

// How a waiting job gets a worker. The jobs themselves live in the database, so any of these
// can be swapped without touching the rest:
//
//   JOB_DISPATCHER=after    (default) run a worker right after the response with Next's after(),
//                           and chain more workers through /api/jobs/process while work is left.
//   JOB_DISPATCHER=webhook  POST {"userId"} to JOB_DISPATCH_URL (an external queue such as
//                           Vercel Queues, QStash or Inngest); that service calls back
//                           /api/jobs/process with the bearer secret.
//   JOB_DISPATCHER=none     do nothing (tests, or a separate worker running `drain`).
//
// Whatever is left over is also picked up when the editor polls and by the cron (vercel.json).

export type DispatcherKind = "after" | "webhook" | "none";

export function dispatcherKind(): DispatcherKind {
  const kind = process.env.JOB_DISPATCHER;
  return kind === "webhook" || kind === "none" ? kind : "after";
}

/** The bearer secret protecting /api/jobs/process: JOBS_SECRET, or CRON_SECRET (which Vercel's cron sends). */
export const jobsSecret = () => process.env.JOBS_SECRET || process.env.CRON_SECRET || "";

export function authorizedWorker(request: Request): boolean {
  const secret = jobsSecret();
  if (!secret) return false;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/** Asks the worker endpoint (a new invocation, with its own time limit) to carry on with a user's jobs. */
async function continueViaHttp(userId: string): Promise<void> {
  const secret = jobsSecret();
  if (!secret) return; // no secret, no chaining: the poll and the cron still pick the jobs up
  try {
    await fetch(`${siteUrl()}/api/jobs/process`, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
      body: JSON.stringify({ userId }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error("Couldn't hand over to another job worker", error instanceof Error ? error.message : error);
  }
}

async function postToQueue(userId: string): Promise<boolean> {
  const url = process.env.JOB_DISPATCH_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...(jobsSecret() ? { authorization: `Bearer ${jobsSecret()}` } : {}) },
      body: JSON.stringify({ userId }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Work this process does itself, within its time budget. */
export const runWorker = (userId?: string) => {
  const options = { deadline: Date.now() + workerBudgetMs(), onMore: continueViaHttp };
  return userId ? drainUser(userId, options) : drainAll(options);
};

const lastKick = new Map<string, number>();

/**
 * Makes sure someone will work on the user's jobs. Never throws and never waits for the work.
 * `throttleMs` skips the call if the same user was kicked a moment ago (the editor's poll).
 */
export function dispatchJobs(hint: { userId?: string; throttleMs?: number } = {}): void {
  const kind = dispatcherKind();
  if (kind === "none") return;
  const key = hint.userId ?? "*";
  const now = Date.now();
  if (hint.throttleMs && now - (lastKick.get(key) ?? 0) < hint.throttleMs) return;
  lastKick.set(key, now);

  const work = async () => {
    if (kind === "webhook" && hint.userId && (await postToQueue(hint.userId))) return;
    await runWorker(hint.userId);
  };
  try {
    after(() => work().catch((error) => console.error("Job worker failed", error)));
  } catch {
    // Not inside a request (a script): just run it.
    void work().catch((error) => console.error("Job worker failed", error));
  }
}

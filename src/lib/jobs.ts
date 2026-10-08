import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma, type GenerationJob } from "@prisma/client";

import { GenerationError } from "./ai";
import { chargeForJob, refundJobCredits } from "./credits";
import { db } from "./db";
import { generateDeckCard } from "./decks";
import { AiBusyError } from "./errors";
import type { JobStage, JobStatus, JobView } from "./job-state";
import { DEFAULT_MODE, MODES, canUseMode, cardCost, isModeId, type ModeId } from "./plans";
import { demoEnabled } from "./demo-ai";
import { parallelCards, premiumAvailable } from "./providers";
import { withUsage, type Usage } from "./router";

// Server-owned card generation. A request to write a card becomes a GenerationJob: it is
// charged once when it is accepted, written in the background (any tab, or none, may be open),
// retried a few times, and refunded once if it still fails. See README, "Background generation".

export const MAX_ATTEMPTS = 3;
/** A running job that hasn't reported for this long was abandoned (its worker died). */
export const LEASE_MS = 90_000;

export function toJobView(job: GenerationJob): JobView {
  return {
    id: job.id,
    cardId: job.cardId,
    status: job.status as JobStatus,
    stage: (job.stage || "") as JobView["stage"],
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    error: job.error,
    errorCode: job.errorCode,
    runAfter: job.runAfter.toISOString(),
    finishedAt: job.finishedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
  };
}

// ---- Accepting jobs -------------------------------------------------------------------------

export type AcceptFailure = "not_found" | "mode_not_allowed" | "premium_unavailable" | "insufficient_credits" | "key_conflict";

export type AcceptResult =
  | { ok: true; job: GenerationJob; created: boolean }
  | { ok: false; reason: AcceptFailure; mode?: ModeId };

/** The HTTP status and message for a refused request. */
export function refusal(reason: AcceptFailure, mode?: ModeId): { status: number; message: string } {
  switch (reason) {
    case "not_found":
      return { status: 404, message: "Card not found." };
    case "mode_not_allowed":
      return { status: 403, message: `${mode ? MODES[mode].label : "That"} mode is part of Pro. Upgrade or pick another mode.` };
    case "premium_unavailable":
      return { status: 403, message: "Premium mode is coming soon. Pick Quick or Standard." };
    case "insufficient_credits":
      return { status: 402, message: "You're out of credits. Upgrade to Pro or wait for your monthly refill." };
    case "key_conflict":
      return { status: 409, message: "That request id was already used for a different card." };
  }
}

/** One writer per user at a time for the steps that must not interleave (accepting, claiming). */
const lockUser = (tx: Prisma.TransactionClient, userId: string) => tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

const isUniqueViolation = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

/**
 * Accepts a request to write a card. Idempotent: if the card already has a waiting or running
 * job, or the request carries a key that was used before, that job comes back and nothing is
 * charged. Otherwise the credits are taken and the job is created in one transaction.
 */
export async function acceptJob(input: {
  user: { id: string; plan: string };
  deckId: string;
  cardId: string;
  mode?: unknown;
  instruction?: string;
  /** From the client (one per user action) so a retried request finds the job it already made. */
  key?: string;
  region?: string | null;
}): Promise<AcceptResult> {
  const { user, deckId, cardId } = input;
  const card = await db.card.findFirst({
    where: { id: cardId, deckId, deck: { userId: user.id } },
    select: { id: true, deck: { select: { mode: true } } },
  });
  if (!card) return { ok: false, reason: "not_found" };

  const mode = isModeId(input.mode) ? input.mode : isModeId(card.deck.mode) ? card.deck.mode : DEFAULT_MODE;
  if (!canUseMode(user.plan, mode)) return { ok: false, reason: "mode_not_allowed", mode };
  if (mode === "premium" && !premiumAvailable()) return { ok: false, reason: "premium_unavailable", mode };

  const cost = cardCost(mode);
  // Keys are per user, so one user's key can never match another's job.
  const key = `${user.id}:${input.key ? input.key.slice(0, 120) : `${cardId}:${randomUUID()}`}`;

  const activeJob = () => db.generationJob.findFirst({ where: { cardId, status: { in: ["queued", "running"] } } });
  try {
    return await db.$transaction(async (tx): Promise<AcceptResult> => {
      await lockUser(tx, user.id);
      const same = await tx.generationJob.findUnique({ where: { idempotencyKey: key } });
      if (same) return same.cardId === cardId ? { ok: true, job: same, created: false } : { ok: false, reason: "key_conflict" };
      const active = await tx.generationJob.findFirst({ where: { cardId, status: { in: ["queued", "running"] } } });
      if (active) return { ok: true, job: active, created: false };

      if (!(await chargeForJob(tx, user.id, cost))) return { ok: false, reason: "insufficient_credits", mode };
      const job = await tx.generationJob.create({
        data: {
          userId: user.id,
          deckId,
          cardId,
          mode,
          instruction: input.instruction ?? "",
          region: input.region ?? null,
          cost,
          maxAttempts: MAX_ATTEMPTS,
          idempotencyKey: key,
          ledger: { create: { userId: user.id, amount: cost, type: "charge", reason: `Write a card (${MODES[mode].label})` } },
        },
      });
      return { ok: true, job, created: true };
    });
  } catch (error) {
    // The database allows one waiting or running job per card: if another request got in first, use its job.
    if (isUniqueViolation(error)) {
      const job = await activeJob();
      if (job) return { ok: true, job, created: false };
    }
    throw error;
  }
}

export interface EnsureResult {
  accepted: number;
  outOfCredits: boolean;
  /** Set when the deck's mode can't be used (e.g. Premium after a downgrade). */
  refused: { status: number; message: string } | null;
}

/**
 * Makes sure every card still waiting to be written has a job, in order, until credits run out.
 * Safe to call again and again (on every page load): cards that have a job are left alone, and
 * the key is the same until a card has had a job, so nothing is charged twice.
 */
export async function ensureDeckJobs(input: { user: { id: string; plan: string }; deckId: string; region?: string | null }): Promise<EnsureResult> {
  const cards = await db.card.findMany({
    where: { deckId: input.deckId, status: "pending", deck: { userId: input.user.id } },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  const result: EnsureResult = { accepted: 0, outOfCredits: false, refused: null };
  for (const card of cards) {
    const prior = await db.generationJob.count({ where: { cardId: card.id } });
    const accepted = await acceptJob({ user: input.user, deckId: input.deckId, cardId: card.id, key: `auto:${card.id}:${prior}`, region: input.region });
    if (accepted.ok) {
      if (accepted.created) result.accepted++;
      continue;
    }
    if (accepted.reason === "insufficient_credits") {
      result.outOfCredits = true;
      break;
    }
    result.refused = refusal(accepted.reason, accepted.mode);
    break;
  }
  return result;
}

// ---- Reading state --------------------------------------------------------------------------

/** The latest job of each card in the deck. */
export async function listDeckJobs(deckId: string): Promise<JobView[]> {
  const rows = await db.generationJob.findMany({ where: { deckId }, orderBy: { createdAt: "desc" }, take: 300 });
  const latest = new Map<string, GenerationJob>();
  for (const row of rows) if (!latest.has(row.cardId)) latest.set(row.cardId, row);
  return [...latest.values()].map(toJobView);
}

/** Whether the user has a waiting job that can start now. */
export async function hasDueJobs(userId: string, now = new Date()): Promise<boolean> {
  return (await db.generationJob.count({ where: { userId, status: "queued", runAfter: { lte: now } } })) > 0;
}

// ---- Claiming and finishing -----------------------------------------------------------------

/**
 * Takes the user's oldest waiting job that is due, if they are under their parallel limit
 * (the plan's and providers' limit: parallelCards). The check and the claim happen under the
 * user's lock, so two workers can't both take the last slot.
 */
export async function claimNext(userId: string, now = new Date()): Promise<GenerationJob | null> {
  return db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const user = await tx.user.findUnique({ where: { id: userId }, select: { plan: true } });
    if (!user) return null;
    const running = await tx.generationJob.count({ where: { userId, status: "running", lockedUntil: { gt: now } } });
    if (running >= parallelCards(user.plan)) return null;
    const next = await tx.generationJob.findFirst({ where: { userId, status: "queued", runAfter: { lte: now } }, orderBy: { createdAt: "asc" } });
    if (!next) return null;
    return tx.generationJob.update({
      where: { id: next.id },
      data: { status: "running", attempts: { increment: 1 }, lockedUntil: new Date(now.getTime() + LEASE_MS), startedAt: now, stage: "" },
    });
  });
}

/**
 * Ends a job that is still waiting or running as failed (or cancelled) and gives its credits
 * back. The status change only succeeds once, and the refund is once per job on top of that,
 * so calling this twice, or from two workers, refunds once.
 * `attempt` makes a worker's verdict count only while it still owns the job.
 */
export async function failJob(
  jobId: string,
  outcome: { error: string; code: string; status?: "failed" | "cancelled"; attempt?: number },
  now = new Date(),
): Promise<boolean> {
  const job = await db.$transaction(async (tx) => {
    const { count } = await tx.generationJob.updateMany({
      where: { id: jobId, status: { in: ["queued", "running"] }, ...(outcome.attempt === undefined ? {} : { attempts: outcome.attempt }) },
      data: { status: outcome.status ?? "failed", error: outcome.error, errorCode: outcome.code, stage: "", finishedAt: now, lockedUntil: null },
    });
    if (count !== 1) return null;
    const row = await tx.generationJob.findUniqueOrThrow({ where: { id: jobId } });
    await refundJobCredits(tx, row, outcome.status === "cancelled" ? "Cancelled: credits returned" : "Card couldn't be written: credits returned");
    return row;
  });
  if (!job) return false;
  // A card that was never written is shown as failed; a rewrite keeps its old content.
  await db.card.updateMany({ where: { id: job.cardId, content: "", status: "pending" }, data: { status: "failed" } });
  return true;
}

/** Cancels (and refunds) the jobs of a card or deck that is being deleted. */
export async function cancelJobs(where: { cardId: string } | { deckId: string }): Promise<number> {
  const jobs = await db.generationJob.findMany({ where: { ...where, status: { in: ["queued", "running"] } }, select: { id: true } });
  let cancelled = 0;
  for (const { id } of jobs) {
    if (await failJob(id, { error: "This slide was deleted.", code: "card_missing", status: "cancelled" })) cancelled++;
  }
  return cancelled;
}

/**
 * Recovers jobs whose worker died (the platform stopped it, or the server restarted): they go
 * back in the queue, or fail and refund when they have used all their attempts.
 */
export async function recoverStale(scope: { userId?: string } = {}, now = new Date()): Promise<number> {
  const stale = await db.generationJob.findMany({
    where: { status: "running", lockedUntil: { lt: now }, ...(scope.userId ? { userId: scope.userId } : {}) },
    take: 50,
  });
  let recovered = 0;
  for (const job of stale) {
    if (job.attempts >= job.maxAttempts) {
      if (await failJob(job.id, { error: "This card took too long to write.", code: "timeout", attempt: job.attempts }, now)) recovered++;
      continue;
    }
    const { count } = await db.generationJob.updateMany({
      where: { id: job.id, status: "running", attempts: job.attempts, lockedUntil: { lt: now } },
      data: { status: "queued", stage: "", lockedUntil: null, runAfter: now, error: null, errorCode: null },
    });
    recovered += count;
  }
  return recovered;
}

// ---- Running a job --------------------------------------------------------------------------

export interface RunDeps {
  /** Writes the card and says which provider answered. Replaceable in tests. */
  writeCard: (job: GenerationJob, onStage: (stage: JobStage) => void) => Promise<Usage | null>;
  now: () => Date;
}

const defaultDeps: RunDeps = {
  writeCard: async (job, onStage) => {
    const { usage } = await withUsage(() =>
      generateDeckCard(job.deckId, job.cardId, isModeId(job.mode) ? job.mode : DEFAULT_MODE, job.instruction || undefined, job.region, { markFailed: false, onStage }),
    );
    return usage ?? (demoEnabled() ? { provider: "demo", model: "sample" } : null);
  },
  now: () => new Date(),
};

interface Verdict {
  retry: boolean;
  delaySeconds: number;
  message: string;
  code: string;
}

function judge(error: unknown): Verdict {
  if (error instanceof AiBusyError) {
    if (error.daily) return { retry: false, delaySeconds: 0, message: error.message, code: "ai_daily_limit" };
    return { retry: true, delaySeconds: Math.min(Math.max(error.retryAfterSeconds, 5), 60), message: error.message, code: "ai_busy" };
  }
  if (error instanceof GenerationError) return { retry: true, delaySeconds: 5, message: error.message, code: "generation" };
  console.error("Card job failed unexpectedly", error);
  return { retry: true, delaySeconds: 5, message: "Couldn't write this card. Try again.", code: "generation" };
}

/**
 * Runs a job this worker has claimed: writes the card, then records the outcome. A failure
 * waits and tries again until the attempts are used up; then the job fails and is refunded.
 */
export async function processJob(job: GenerationJob, deps: Partial<RunDeps> = {}): Promise<JobStatus> {
  const { writeCard, now } = { ...defaultDeps, ...deps };
  const owned = { id: job.id, status: "running", attempts: job.attempts } as const;

  if ((await db.card.count({ where: { id: job.cardId, deckId: job.deckId } })) === 0) {
    await failJob(job.id, { error: "This slide was deleted.", code: "card_missing", status: "cancelled", attempt: job.attempts }, now());
    return "cancelled";
  }

  // Each stage also renews the lease, so a long card isn't mistaken for a dead worker.
  const onStage = (stage: JobStage) => {
    void db.generationJob
      .updateMany({ where: owned, data: { stage, lockedUntil: new Date(now().getTime() + LEASE_MS) } })
      .catch((error) => console.error("Couldn't record job stage", error));
  };

  try {
    const usage = await writeCard(job, onStage);
    const { count } = await db.generationJob.updateMany({
      where: owned,
      data: { status: "succeeded", stage: "", error: null, errorCode: null, finishedAt: now(), lockedUntil: null, provider: usage?.provider ?? null, model: usage?.model ?? null },
    });
    // count 0: the job was recovered by another worker meanwhile, which owns the outcome now.
    return count === 1 ? "succeeded" : "running";
  } catch (error) {
    const verdict = judge(error);
    if (verdict.retry && job.attempts < job.maxAttempts) {
      await db.generationJob.updateMany({
        where: owned,
        data: { status: "queued", stage: "", lockedUntil: null, runAfter: new Date(now().getTime() + verdict.delaySeconds * 1000), error: verdict.message, errorCode: verdict.code },
      });
      return "queued";
    }
    await failJob(job.id, { error: verdict.message, code: verdict.code, attempt: job.attempts }, now());
    return "failed";
  }
}

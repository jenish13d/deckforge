import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../db", async () => ({ db: (await import("./helpers/fake-db")).fake.db }));

const config = vi.hoisted(() => ({ parallel: 2, premium: false }));
vi.mock("../providers", () => ({ parallelCards: () => config.parallel, premiumAvailable: () => config.premium }));
vi.mock("../demo-ai", () => ({ demoEnabled: () => false }));
vi.mock("../router", () => ({ withUsage: async <T,>(fn: () => Promise<T>) => ({ result: await fn(), usage: null }) }));
vi.mock("../decks", () => ({ generateDeckCard: vi.fn() }));

import { GenerationError } from "../ai";
import { AiBusyError } from "../errors";
import { acceptJob, cancelJobs, claimNext, ensureDeckJobs, failJob, listDeckJobs, processJob, recoverStale } from "../jobs";
import { fake, resetFake, seedDeck, seedUser } from "./helpers/fake-db";

type Job = { id: string; status: string; attempts: number; runAfter: Date; lockedUntil: Date | null; cardId: string; userId: string; cost: number; deckId: string; error: string | null; errorCode: string | null; provider: string | null };
const job = (id: string) => fake.jobs.rows.find((r) => r.id === id) as unknown as Job;
const balance = (userId: string) => (fake.users.rows.find((u) => u.id === userId) as unknown as { credits: number }).credits;
const entries = (type?: string) => fake.ledger.rows.filter((r) => !type || r.type === type);
const cardStatus = (cardId: string) => (fake.cards.rows.find((c) => c.id === cardId) as unknown as { status: string }).status;

beforeEach(() => {
  resetFake();
  config.parallel = 2;
  config.premium = false;
});

async function accepted(user: { id: string; plan: string }, deckId: string, cardId: string, extra: { key?: string; mode?: unknown } = {}) {
  const result = await acceptJob({ user, deckId, cardId, ...extra });
  if (!result.ok) throw new Error(`refused: ${result.reason}`);
  return result;
}

describe("accepting a job", () => {
  it("charges once, records the charge in the ledger and queues the job", async () => {
    const user = seedUser({ credits: 10 });
    const { deckId, cardIds } = seedDeck(user.id);
    const { job: made, created } = await accepted(user, deckId, cardIds[0]);

    expect(created).toBe(true);
    expect(made.status).toBe("queued");
    expect(made.cost).toBe(2); // Standard
    expect(balance(user.id)).toBe(8);
    expect(entries()).toHaveLength(1);
    expect(entries()[0]).toMatchObject({ type: "charge", amount: 2, jobId: made.id, userId: user.id });
  });

  it("returns the same job for a repeated request while one is waiting or running, and never charges again", async () => {
    const user = seedUser({ credits: 10 });
    const { deckId, cardIds } = seedDeck(user.id);
    const first = await accepted(user, deckId, cardIds[0]);
    const again = await accepted(user, deckId, cardIds[0]);
    expect(again.created).toBe(false);
    expect(again.job.id).toBe(first.job.id);

    await claimNext(user.id); // now running
    const whileRunning = await accepted(user, deckId, cardIds[0]);
    expect(whileRunning.job.id).toBe(first.job.id);
    expect(fake.jobs.rows).toHaveLength(1);
    expect(balance(user.id)).toBe(8);
    expect(entries()).toHaveLength(1);
  });

  it("treats simultaneous requests (two tabs) as one", async () => {
    const user = seedUser({ credits: 10 });
    const { deckId, cardIds } = seedDeck(user.id);
    const results = await Promise.all([accepted(user, deckId, cardIds[0]), accepted(user, deckId, cardIds[0]), accepted(user, deckId, cardIds[0])]);
    expect(new Set(results.map((r) => r.job.id)).size).toBe(1);
    expect(results.filter((r) => r.created)).toHaveLength(1);
    expect(balance(user.id)).toBe(8);
  });

  it("finds the finished job again when a request is retried with the same key", async () => {
    const user = seedUser({ credits: 10 });
    const { deckId, cardIds } = seedDeck(user.id);
    const first = await accepted(user, deckId, cardIds[0], { key: "click-1" });
    const claimed = (await claimNext(user.id))!;
    await processJob(claimed, { writeCard: async () => null });
    expect(job(first.job.id).status).toBe("succeeded");

    const retry = await accepted(user, deckId, cardIds[0], { key: "click-1" });
    expect(retry.created).toBe(false);
    expect(retry.job.id).toBe(first.job.id);
    expect(balance(user.id)).toBe(8);

    // A new click is a new rewrite and is charged.
    const rewrite = await accepted(user, deckId, cardIds[0], { key: "click-2" });
    expect(rewrite.created).toBe(true);
    expect(balance(user.id)).toBe(6);
  });

  it("refuses a key that belongs to another card", async () => {
    const user = seedUser({ credits: 10 });
    const { deckId, cardIds } = seedDeck(user.id, 2);
    await accepted(user, deckId, cardIds[0], { key: "same" });
    const clash = await acceptJob({ user, deckId, cardId: cardIds[1], key: "same" });
    expect(clash).toMatchObject({ ok: false, reason: "key_conflict" });
    expect(balance(user.id)).toBe(8);
  });

  it("refuses without credits, taking nothing and creating nothing", async () => {
    const user = seedUser({ credits: 1 });
    const { deckId, cardIds } = seedDeck(user.id);
    expect(await acceptJob({ user, deckId, cardId: cardIds[0] })).toMatchObject({ ok: false, reason: "insufficient_credits" });
    expect(balance(user.id)).toBe(1);
    expect(fake.jobs.rows).toHaveLength(0);
    expect(entries()).toHaveLength(0);
  });

  it("keeps plan gating and ownership", async () => {
    const user = seedUser({ credits: 50 });
    const other = seedUser({ credits: 50 });
    const { deckId, cardIds } = seedDeck(user.id);
    expect(await acceptJob({ user, deckId, cardId: cardIds[0], mode: "premium" })).toMatchObject({ ok: false, reason: "mode_not_allowed" });
    expect(await acceptJob({ user: other, deckId, cardId: cardIds[0] })).toMatchObject({ ok: false, reason: "not_found" });
    expect(balance(user.id)).toBe(50);
    expect(balance(other.id)).toBe(50);

    const pro = seedUser({ credits: 50, plan: "pro" });
    const proDeck = seedDeck(pro.id);
    expect(await acceptJob({ user: pro, deckId: proDeck.deckId, cardId: proDeck.cardIds[0], mode: "premium" })).toMatchObject({ ok: false, reason: "premium_unavailable" });
    config.premium = true;
    expect(await acceptJob({ user: pro, deckId: proDeck.deckId, cardId: proDeck.cardIds[0], mode: "premium" })).toMatchObject({ ok: true });
    expect(balance(pro.id)).toBe(46); // Premium costs 4
  });
});

describe("a successful job", () => {
  it("keeps the charge, records who wrote it and never refunds", async () => {
    const user = seedUser({ credits: 10 });
    const { deckId, cardIds } = seedDeck(user.id);
    const { job: made } = await accepted(user, deckId, cardIds[0]);
    const claimed = (await claimNext(user.id))!;
    expect(claimed.status).toBe("running");
    expect(claimed.attempts).toBe(1);

    const stages: string[] = [];
    const outcome = await processJob(claimed, {
      writeCard: async (_job, onStage) => {
        onStage("writing");
        stages.push("writing");
        return { provider: "groq", model: "llama-test" };
      },
    });

    expect(outcome).toBe("succeeded");
    expect(job(made.id)).toMatchObject({ status: "succeeded", provider: "groq", error: null });
    expect(balance(user.id)).toBe(8);
    expect(entries("refund")).toHaveLength(0);
    expect(entries("charge")).toHaveLength(1);
  });
});

describe("a failing job", () => {
  async function started() {
    const user = seedUser({ credits: 10 });
    const { deckId, cardIds } = seedDeck(user.id);
    const { job: made } = await accepted(user, deckId, cardIds[0]);
    return { user, deckId, cardId: cardIds[0], jobId: made.id };
  }
  const boom = async () => {
    throw new GenerationError("The AI couldn't write this.");
  };

  it("retries without charging again, then refunds exactly once when attempts run out", async () => {
    const { user, cardId, jobId } = await started();

    for (let attempt = 1; attempt <= 3; attempt++) {
      const claimed = (await claimNext(user.id, new Date(Date.now() + 60_000)))!;
      expect(claimed.attempts).toBe(attempt);
      const outcome = await processJob(claimed, { writeCard: boom });
      expect(outcome).toBe(attempt < 3 ? "queued" : "failed");
      if (attempt < 3) {
        // Retrying: still charged once, waiting for a later time, with the reason on show.
        expect(job(jobId)).toMatchObject({ status: "queued", errorCode: "generation" });
        expect(job(jobId).runAfter.getTime()).toBeGreaterThan(Date.now());
        expect(balance(user.id)).toBe(8);
        expect(entries()).toHaveLength(1);
      }
    }

    expect(job(jobId)).toMatchObject({ status: "failed", errorCode: "generation" });
    expect(balance(user.id)).toBe(10);
    expect(entries("charge")).toHaveLength(1);
    expect(entries("refund")).toHaveLength(1);
    expect(cardStatus(cardId)).toBe("failed");

    // Neither another verdict nor a second worker can refund again.
    expect(await failJob(jobId, { error: "again", code: "generation" })).toBe(false);
    expect(await failJob(jobId, { error: "again", code: "generation", attempt: 3 })).toBe(false);
    expect(balance(user.id)).toBe(10);
    expect(entries("refund")).toHaveLength(1);
  });

  it("does not wait to retry when the AI's daily limit is reached: fails and refunds", async () => {
    const { user, jobId } = await started();
    const claimed = (await claimNext(user.id))!;
    await processJob(claimed, { writeCard: async () => { throw new AiBusyError(3600, true); } });
    expect(job(jobId)).toMatchObject({ status: "failed", errorCode: "ai_daily_limit" });
    expect(balance(user.id)).toBe(10);
    expect(entries("refund")).toHaveLength(1);
  });

  it("waits out a busy AI as long as it asks (within limits) and then succeeds without a second charge", async () => {
    const { user, jobId } = await started();
    const first = (await claimNext(user.id))!;
    await processJob(first, { writeCard: async () => { throw new AiBusyError(30, false); } });
    expect(job(jobId)).toMatchObject({ status: "queued", errorCode: "ai_busy" });
    const waitMs = job(jobId).runAfter.getTime() - Date.now();
    expect(waitMs).toBeGreaterThan(25_000);
    expect(waitMs).toBeLessThanOrEqual(31_000);

    expect(await claimNext(user.id)).toBeNull(); // not due yet
    const second = (await claimNext(user.id, new Date(Date.now() + 31_000)))!;
    await processJob(second, { writeCard: async () => null });
    expect(job(jobId).status).toBe("succeeded");
    expect(balance(user.id)).toBe(8);
    expect(entries("refund")).toHaveLength(0);
  });

  it("keeps an existing slide's content when a rewrite fails, and refunds the rewrite", async () => {
    const { user, deckId, cardId } = await started();
    const row = fake.cards.rows.find((c) => c.id === cardId)!;
    row.status = "ready";
    row.content = "{}";
    await failJob((fake.jobs.rows[0] as unknown as Job).id, { error: "nope", code: "generation" });
    expect(cardStatus(cardId)).toBe("ready");
    expect(balance(user.id)).toBe(10);
    expect(deckId).toBeTruthy();
  });
});

describe("workers that die", () => {
  it("puts an abandoned job back in the queue, and fails and refunds it after its last attempt", async () => {
    const user = seedUser({ credits: 10 });
    const { deckId, cardIds } = seedDeck(user.id, 2);
    const a = (await accepted(user, deckId, cardIds[0])).job;
    const b = (await accepted(user, deckId, cardIds[1])).job;
    const [claimedA, claimedB] = [(await claimNext(user.id))!, (await claimNext(user.id))!];
    expect([claimedA.id, claimedB.id].sort()).toEqual([a.id, b.id].sort());

    const later = new Date(Date.now() + 5 * 60_000);
    job(claimedB.id).attempts = 3; // B has used every attempt
    expect(await recoverStale({}, later)).toBe(2);
    expect(job(claimedA.id)).toMatchObject({ status: "queued", lockedUntil: null });
    expect(job(claimedB.id)).toMatchObject({ status: "failed", errorCode: "timeout" });
    expect(balance(user.id)).toBe(8); // 10 - 4 charged + 2 refunded
    expect(entries("refund")).toHaveLength(1);
  });

  it("ignores the verdict of a worker that lost its job to a recovery", async () => {
    const user = seedUser({ credits: 10 });
    const { deckId, cardIds } = seedDeck(user.id);
    const { job: made } = await accepted(user, deckId, cardIds[0]);
    const zombie = (await claimNext(user.id))!;
    const later = new Date(Date.now() + 5 * 60_000);
    await recoverStale({}, later);
    const second = (await claimNext(user.id, later))!;
    expect(second.attempts).toBe(2);

    expect(await processJob(zombie, { writeCard: boomSuccess })).toBe("running"); // its result no longer counts
    expect(job(made.id).status).toBe("running");
    await processJob(second, { writeCard: async () => null });
    expect(job(made.id).status).toBe("succeeded");
    expect(balance(user.id)).toBe(8);
  });
});
const boomSuccess = async () => null;

describe("parallel limit", () => {
  it("lets a user run only as many jobs at once as their plan and providers allow", async () => {
    const user = seedUser({ credits: 20 });
    const { deckId, cardIds } = seedDeck(user.id, 3);
    for (const id of cardIds) await accepted(user, deckId, id);

    const [a, b, c] = [await claimNext(user.id), await claimNext(user.id), await claimNext(user.id)];
    expect(a && b).toBeTruthy();
    expect(c).toBeNull();
    await processJob(a!, { writeCard: async () => null });
    expect(await claimNext(user.id)).toMatchObject({ status: "running" });
  });

  it("starts jobs in the order they were accepted", async () => {
    const user = seedUser({ credits: 20 });
    const { deckId, cardIds } = seedDeck(user.id, 3);
    const ids = [];
    for (const id of cardIds) ids.push((await accepted(user, deckId, id)).job.id);
    expect((await claimNext(user.id))!.id).toBe(ids[0]);
    expect((await claimNext(user.id))!.id).toBe(ids[1]);
  });
});

describe("starting a deck, and refreshing the page", () => {
  it("queues every waiting card once, however often the editor asks", async () => {
    const user = seedUser({ credits: 20 });
    const { deckId } = seedDeck(user.id, 3);

    const first = await ensureDeckJobs({ user, deckId });
    const refreshed = await ensureDeckJobs({ user, deckId });
    const otherTab = await ensureDeckJobs({ user, deckId });
    expect(first).toMatchObject({ accepted: 3, outOfCredits: false });
    expect(refreshed.accepted).toBe(0);
    expect(otherTab.accepted).toBe(0);
    expect(fake.jobs.rows).toHaveLength(3);
    expect(balance(user.id)).toBe(14);
    expect(entries("charge")).toHaveLength(3);
  });

  it("reports what is left when credits run out, and stays that way on refresh", async () => {
    const user = seedUser({ credits: 5 });
    const { deckId } = seedDeck(user.id, 3);
    const first = await ensureDeckJobs({ user, deckId });
    expect(first).toMatchObject({ accepted: 2, outOfCredits: true });
    expect(balance(user.id)).toBe(1);
    const refreshed = await ensureDeckJobs({ user, deckId });
    expect(refreshed).toMatchObject({ accepted: 0, outOfCredits: true });
    expect(fake.jobs.rows).toHaveLength(2);
  });

  it("shows after a refresh where every card stands, and picks the work up again", async () => {
    const user = seedUser({ credits: 20 });
    const { deckId, cardIds } = seedDeck(user.id, 3);
    await ensureDeckJobs({ user, deckId });

    // The first card is written; the second is in the middle of it; the third is waiting.
    const first = (await claimNext(user.id))!;
    // Writing a card leaves it "ready", as generateDeckCard does.
    await processJob(first, { writeCard: async (j) => { fake.cards.rows.find((c) => c.id === j.cardId)!.status = "ready"; return null; } });
    (await claimNext(user.id))!;

    const view = await listDeckJobs(deckId);
    const byCard = Object.fromEntries(view.map((j) => [j.cardId, j.status]));
    expect(byCard).toEqual({ [cardIds[0]]: "succeeded", [cardIds[1]]: "running", [cardIds[2]]: "queued" });

    // The page is refreshed: asking again changes nothing and charges nothing.
    expect((await ensureDeckJobs({ user, deckId })).accepted).toBe(0);
    expect(balance(user.id)).toBe(14);
    // Meanwhile the first card's content is on the server for the reloaded editor to read.
    expect(fake.cards.rows).toHaveLength(3);
  });

  it("gives a card that failed its own new job when it is rewritten", async () => {
    const user = seedUser({ credits: 20 });
    const { deckId, cardIds } = seedDeck(user.id, 1);
    await ensureDeckJobs({ user, deckId });
    const claimed = (await claimNext(user.id))!;
    await failJob(claimed.id, { error: "nope", code: "generation" });
    expect(cardStatus(cardIds[0])).toBe("failed");
    expect(balance(user.id)).toBe(20);

    // A failed card isn't started again by itself (it is no longer waiting) ...
    expect((await ensureDeckJobs({ user, deckId })).accepted).toBe(0);
    // ... but "Rewrite" starts a new, separately charged job.
    const rewrite = await accepted(user, deckId, cardIds[0], { key: "rewrite-1" });
    expect(rewrite.created).toBe(true);
    expect(balance(user.id)).toBe(18);
  });
});

describe("deleting a card or deck", () => {
  it("cancels its waiting and running jobs and returns their credits once", async () => {
    const user = seedUser({ credits: 20 });
    const { deckId, cardIds } = seedDeck(user.id, 2);
    await ensureDeckJobs({ user, deckId });
    await claimNext(user.id);
    expect(balance(user.id)).toBe(16);

    expect(await cancelJobs({ deckId })).toBe(2);
    expect(await cancelJobs({ deckId })).toBe(0);
    expect(balance(user.id)).toBe(20);
    expect(entries("refund")).toHaveLength(2);
    expect(fake.jobs.rows.every((j) => j.status === "cancelled")).toBe(true);
    expect(cardIds).toHaveLength(2);
  });

  it("cancels (and refunds) a job whose card was deleted before it started", async () => {
    const user = seedUser({ credits: 10 });
    const { deckId, cardIds } = seedDeck(user.id);
    await accepted(user, deckId, cardIds[0]);
    fake.cards.rows.length = 0; // the card is gone
    const claimed = (await claimNext(user.id))!;
    expect(await processJob(claimed, { writeCard: async () => { throw new Error("should not run"); } })).toBe("cancelled");
    expect(balance(user.id)).toBe(10);
  });
});

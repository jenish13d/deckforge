import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../db", async () => ({ db: (await import("./helpers/fake-db")).fake.db }));

const config = vi.hoisted(() => ({ parallel: 2 }));
vi.mock("../providers", () => ({ parallelCards: () => config.parallel, premiumAvailable: () => false }));
vi.mock("../demo-ai", () => ({ demoEnabled: () => false }));
vi.mock("../router", () => ({ withUsage: async <T,>(fn: () => Promise<T>) => ({ result: await fn(), usage: { provider: "groq", model: "test-model" } }) }));

const after = vi.hoisted(() => ({ callbacks: [] as (() => unknown)[] }));
vi.mock("next/server", () => ({ after: (fn: () => unknown) => after.callbacks.push(fn) }));

const written = vi.hoisted(() => ({ calls: [] as string[], fail: new Set<string>() }));
vi.mock("../decks", async () => {
  const { fake } = await import("./helpers/fake-db");
  const { GenerationError } = await import("../errors");
  return {
    generateDeckCard: async (_deck: string, cardId: string) => {
      written.calls.push(cardId);
      if (written.fail.has(cardId)) throw new GenerationError("The AI couldn't write this.");
      fake.cards.rows.find((c) => c.id === cardId)!.status = "ready";
    },
  };
});

import { authorizedWorker, dispatchJobs } from "../job-dispatch";
import { ensureDeckJobs, listDeckJobs } from "../jobs";
import { drainUser } from "../worker";
import { fake, resetFake, seedDeck, seedUser } from "./helpers/fake-db";

beforeEach(() => {
  resetFake();
  config.parallel = 2;
  after.callbacks.length = 0;
  written.calls.length = 0;
  written.fail.clear();
});
afterEach(() => vi.unstubAllEnvs());

const balance = (id: string) => (fake.users.rows.find((u) => u.id === id) as unknown as { credits: number }).credits;

describe("the worker", () => {
  it("writes a whole deck on the server, with no browser involved, and records the provider", async () => {
    const user = seedUser({ credits: 20 });
    const { deckId, cardIds } = seedDeck(user.id, 4);
    await ensureDeckJobs({ user, deckId });

    expect(await drainUser(user.id, { deadline: Date.now() + 5000 })).toBe(4);

    const jobs = await listDeckJobs(deckId);
    expect(jobs.map((j) => j.status)).toEqual(["succeeded", "succeeded", "succeeded", "succeeded"]);
    expect(fake.jobs.rows.every((j) => j.provider === "groq" && j.model === "test-model")).toBe(true);
    expect(fake.cards.rows.every((c) => c.status === "ready")).toBe(true);
    expect(written.calls.sort()).toEqual([...cardIds].sort());
    expect(balance(user.id)).toBe(12);
  });

  it("writes each card once even when several workers run at the same time", async () => {
    const user = seedUser({ credits: 20 });
    const { deckId } = seedDeck(user.id, 5);
    await ensureDeckJobs({ user, deckId });
    config.parallel = 3;
    const deadline = Date.now() + 5000;
    await Promise.all([drainUser(user.id, { deadline }), drainUser(user.id, { deadline }), drainUser(user.id, { deadline })]);
    expect(written.calls).toHaveLength(5);
    expect(new Set(written.calls).size).toBe(5);
  });

  it("refunds a card that keeps failing, while the other cards finish", async () => {
    const user = seedUser({ credits: 20 });
    const { deckId, cardIds } = seedDeck(user.id, 3);
    written.fail.add(cardIds[1]);
    await ensureDeckJobs({ user, deckId });
    // Short retry waits: let the retries come due.
    vi.useFakeTimers();
    const run = drainUser(user.id, { deadline: Date.now() + 120_000 });
    await vi.advanceTimersByTimeAsync(60_000);
    await run;
    vi.useRealTimers();

    const byCard = Object.fromEntries((await listDeckJobs(deckId)).map((j) => [j.cardId, j.status]));
    expect(byCard).toEqual({ [cardIds[0]]: "succeeded", [cardIds[1]]: "failed", [cardIds[2]]: "succeeded" });
    expect(written.calls.filter((c) => c === cardIds[1])).toHaveLength(3); // three attempts
    expect(balance(user.id)).toBe(16); // 20 - 3 cards * 2 + 2 refunded
    expect(fake.ledger.rows.filter((r) => r.type === "refund")).toHaveLength(1);
  });

  it("stops taking new jobs when its time is up and hands the rest on", async () => {
    const user = seedUser({ credits: 20 });
    const { deckId } = seedDeck(user.id, 3);
    await ensureDeckJobs({ user, deckId });
    config.parallel = 1;
    const onMore = vi.fn();
    expect(await drainUser(user.id, { deadline: Date.now() - 1, onMore })).toBe(0);
    expect(onMore).toHaveBeenCalledWith(user.id);
    expect(written.calls).toHaveLength(0);
  });
});

describe("dispatching", () => {
  it("only lets callers with the secret reach the worker endpoint", () => {
    const request = (auth?: string) => new Request("http://x.test/api/jobs/process", { headers: auth ? { authorization: auth } : {} });
    expect(authorizedWorker(request("Bearer s3cret"))).toBe(false); // no secret configured: closed
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(authorizedWorker(request("Bearer s3cret"))).toBe(true);
    expect(authorizedWorker(request("Bearer wrong!"))).toBe(false);
    expect(authorizedWorker(request())).toBe(false);
    vi.stubEnv("JOBS_SECRET", "other");
    expect(authorizedWorker(request("Bearer other"))).toBe(true);
    expect(authorizedWorker(request("Bearer s3cret"))).toBe(false);
  });

  it("schedules a worker after the response by default, and nothing when switched off", () => {
    dispatchJobs({ userId: "u1" });
    expect(after.callbacks).toHaveLength(1);
    vi.stubEnv("JOB_DISPATCHER", "none");
    dispatchJobs({ userId: "u2" });
    expect(after.callbacks).toHaveLength(1);
  });

  it("skips a repeated nudge for the same user inside the throttle window", () => {
    dispatchJobs({ userId: "u3", throttleMs: 60_000 });
    dispatchJobs({ userId: "u3", throttleMs: 60_000 });
    expect(after.callbacks).toHaveLength(1);
  });
});

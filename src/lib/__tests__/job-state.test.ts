import { describe, expect, it } from "vitest";

import { describeJob, isActive, showsFailure, type JobView } from "../job-state";

const job = (over: Partial<JobView> = {}): JobView => ({
  id: "j1",
  cardId: "c1",
  status: "queued",
  stage: "",
  attempts: 0,
  maxAttempts: 3,
  error: null,
  errorCode: null,
  runAfter: new Date(0).toISOString(),
  finishedAt: null,
  createdAt: new Date(0).toISOString(),
  ...over,
});

describe("what a card says about its job", () => {
  it("shows queued, researching, writing, checking and photo stages", () => {
    expect(describeJob(job())).toEqual({ phase: "queued", label: "Waiting for its turn…" });
    expect(describeJob(job({ status: "running", stage: "researching" }))).toMatchObject({ phase: "working", label: "Researching sources…" });
    expect(describeJob(job({ status: "running", stage: "writing" }))?.label).toBe("Writing the slide…");
    expect(describeJob(job({ status: "running", stage: "checking" }))?.label).toBe("Checking the facts…");
    expect(describeJob(job({ status: "running", stage: "photos" }))?.label).toBe("Finding a photo…");
    expect(describeJob(job({ status: "running" }))?.phase).toBe("working");
  });

  it("shows retrying with the countdown and attempt number", () => {
    const now = Date.parse("2026-01-01T00:00:00Z");
    const retrying = describeJob(job({ attempts: 1, errorCode: "ai_busy", runAfter: new Date(now + 12_000).toISOString() }), now);
    expect(retrying?.phase).toBe("retrying");
    expect(retrying?.label).toContain("AI is busy");
    expect(retrying?.label).toContain("12s");
    expect(retrying?.label).toContain("attempt 2 of 3");
    expect(describeJob(job({ attempts: 2, errorCode: "generation", runAfter: new Date(now - 1000).toISOString() }), now)?.label).toContain("Retrying now");
  });

  it("shows done and failed", () => {
    expect(describeJob(job({ status: "succeeded" }))?.phase).toBe("done");
    expect(describeJob(job({ status: "failed", error: "Today's free AI limit has been reached." }))).toEqual({ phase: "failed", label: "Today's free AI limit has been reached." });
    expect(describeJob(null)).toBeNull();
  });

  it("knows which jobs are still in progress", () => {
    expect(["queued", "running"].map((status) => isActive(job({ status: status as JobView["status"] })))).toEqual([true, true]);
    expect(["succeeded", "failed", "cancelled"].map((status) => isActive(job({ status: status as JobView["status"] })))).toEqual([false, false, false]);
    expect(isActive(undefined)).toBe(false);
  });

  it("shows an old failure only on a card with nothing written, or for a few minutes", () => {
    const now = Date.now();
    const failed = job({ status: "failed", finishedAt: new Date(now - 60_000).toISOString() });
    const stale = job({ status: "failed", finishedAt: new Date(now - 3_600_000).toISOString() });
    expect(showsFailure(failed, true, now)).toBe(true);
    expect(showsFailure(stale, true, now)).toBe(false);
    expect(showsFailure(stale, false, now)).toBe(true);
    expect(showsFailure(job({ status: "succeeded" }), false, now)).toBe(false);
  });
});

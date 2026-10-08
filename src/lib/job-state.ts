// What the browser knows about a generation job, and how it is worded. No server code here,
// so the editor can import it.

export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
export type JobStage = "researching" | "writing" | "checking" | "photos";

export interface JobView {
  id: string;
  cardId: string;
  status: JobStatus;
  stage: JobStage | "";
  attempts: number;
  maxAttempts: number;
  error: string | null;
  /** Short code for the UI: "ai_busy", "ai_daily_limit", "generation", "card_missing", "timeout". */
  errorCode: string | null;
  /** ISO time; a queued job with attempts > 0 is waiting here to retry. */
  runAfter: string;
  finishedAt: string | null;
  createdAt: string;
}

export const isActive = (job: Pick<JobView, "status"> | undefined | null): boolean => job?.status === "queued" || job?.status === "running";

/** How long a failure stays on a card that still has its content before it is forgotten. */
export const FAILURE_SHOWN_MS = 10 * 60 * 1000;

export type JobPhase = "queued" | "working" | "retrying" | "done" | "failed";

/** The state a card shows for its latest job. */
export function describeJob(job: JobView | undefined | null, now = Date.now()): { phase: JobPhase; label: string } | null {
  if (!job) return null;
  if (job.status === "succeeded") return { phase: "done", label: "Done" };
  if (job.status === "failed" || job.status === "cancelled") return { phase: "failed", label: job.error ?? "This card couldn't be written." };
  if (job.status === "queued") {
    if (job.attempts > 0) {
      const seconds = Math.max(0, Math.ceil((new Date(job.runAfter).getTime() - now) / 1000));
      const why = job.errorCode === "ai_busy" ? "The AI is busy (free plan limit)" : "That didn't work";
      return { phase: "retrying", label: `${why}. Retrying${seconds > 0 ? ` in ${seconds}s` : " now"}… (attempt ${Math.min(job.attempts + 1, job.maxAttempts)} of ${job.maxAttempts})` };
    }
    return { phase: "queued", label: "Waiting for its turn…" };
  }
  const label =
    job.stage === "researching" ? "Researching sources…"
    : job.stage === "checking" ? "Checking the facts…"
    : job.stage === "photos" ? "Finding a photo…"
    : "Writing the slide…";
  return { phase: "working", label };
}

/** A failure worth showing: the card has no content, or it failed a moment ago. */
export const showsFailure = (job: JobView | undefined, hasContent: boolean, now = Date.now()): boolean =>
  Boolean(job && (job.status === "failed" || job.status === "cancelled") && (!hasContent || (job.finishedAt && now - new Date(job.finishedAt).getTime() < FAILURE_SHOWN_MS)));

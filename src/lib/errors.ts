/** An AI generation failure whose message is safe to show to users. */
export class GenerationError extends Error {}

/** Every AI we could use is at its free limit; says when it's worth trying again. */
export class AiBusyError extends GenerationError {
  constructor(
    readonly retryAfterSeconds: number,
    readonly daily: boolean,
    message = daily
      ? "Today's free AI limit has been reached. Please try again tomorrow."
      : "The AI is busy right now (free plan limit). Retrying shortly…",
  ) {
    super(message);
  }
}

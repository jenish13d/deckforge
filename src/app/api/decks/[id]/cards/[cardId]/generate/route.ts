import { getCurrentUser } from "@/lib/auth";
import { creditsOf } from "@/lib/credits";
import { ownsCard } from "@/lib/decks";
import { forbidden, jsonError, readJson, str, unauthorized } from "@/lib/http";
import { dispatchJobs } from "@/lib/job-dispatch";
import { acceptJob, refusal, toJobView } from "@/lib/jobs";
import { clientCountry, clientKey, limits } from "@/lib/rate-limit";

// The worker runs after this response, in this same invocation, so it needs room for AI calls.
export const maxDuration = 60;

/**
 * Asks for a card to be written (or rewritten). The request becomes a job on the server and
 * this answers straight away; the editor follows the job's progress. Repeating the request
 * (same card with a job in progress, or the same `key`) returns that job and charges nothing.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/decks/[id]/cards/[cardId]/generate">) {
  const { id, cardId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await ownsCard(user.id, id, cardId))) return forbidden();
  if (!limits.card(user.id) || !limits.card(clientKey(request))) {
    return jsonError("Too many requests. Try again later.", 429);
  }

  const body = await readJson(request);
  const key = str(request.headers.get("idempotency-key") ?? body?.key, 120) || undefined;
  const result = await acceptJob({
    user,
    deckId: id,
    cardId,
    mode: body?.mode,
    instruction: str(body?.instructions, 500),
    key,
    region: clientCountry(request),
  });
  if (!result.ok) {
    const { status, message } = refusal(result.reason, result.mode);
    return jsonError(message, status);
  }
  dispatchJobs({ userId: user.id });
  return Response.json({ job: toJobView(result.job), created: result.created, credits: await creditsOf(user.id) }, { status: result.created ? 202 : 200 });
}

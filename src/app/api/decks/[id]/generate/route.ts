import { getCurrentUser } from "@/lib/auth";
import { creditsOf } from "@/lib/credits";
import { ownsDeck } from "@/lib/decks";
import { forbidden, jsonError, unauthorized } from "@/lib/http";
import { dispatchJobs } from "@/lib/job-dispatch";
import { ensureDeckJobs, listDeckJobs } from "@/lib/jobs";
import { clientCountry, clientKey, limits } from "@/lib/rate-limit";

export const maxDuration = 60;

/**
 * Starts (or resumes) writing a deck: every card still waiting gets a job, in order, until
 * credits run out. The editor calls this when it opens, so a deck keeps going after a refresh,
 * and calling it again is harmless: nothing is charged twice.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/decks/[id]/generate">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await ownsDeck(user.id, id))) return forbidden();
  if (!limits.card(user.id) || !limits.card(clientKey(request))) {
    return jsonError("Too many requests. Try again later.", 429);
  }

  const result = await ensureDeckJobs({ user, deckId: id, region: clientCountry(request) });
  dispatchJobs({ userId: user.id });
  return Response.json({ ...result, jobs: await listDeckJobs(id), credits: await creditsOf(user.id) });
}

import { getCurrentUser } from "@/lib/auth";
import { creditsOf } from "@/lib/credits";
import { ownsDeck } from "@/lib/decks";
import { forbidden, unauthorized } from "@/lib/http";
import { dispatchJobs } from "@/lib/job-dispatch";
import { listDeckJobs, recoverStale } from "@/lib/jobs";

export const maxDuration = 60;

/**
 * Where each card of the deck stands, and the user's credits. The editor polls this, so after a
 * refresh (or in a second tab) it shows the same truth. Polling also helps the work along: jobs
 * whose worker died are recovered, and a waiting job that is due gets a worker.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/decks/[id]/jobs">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await ownsDeck(user.id, id))) return forbidden();

  await recoverStale({ userId: user.id });
  const jobs = await listDeckJobs(id);
  const now = Date.now();
  if (jobs.some((j) => j.status === "queued" && new Date(j.runAfter).getTime() <= now)) {
    dispatchJobs({ userId: user.id, throttleMs: 5000 });
  }
  return Response.json({ jobs, credits: await creditsOf(user.id) }, { headers: { "Cache-Control": "no-store" } });
}

import { after } from "next/server";

import { authorizedWorker, runWorker } from "@/lib/job-dispatch";
import { jsonError, readJson } from "@/lib/http";

// The worker endpoint: Vercel's cron calls it with GET, and workers (and external queues) with
// POST {"userId"} to carry on with one user's jobs. It answers at once and works afterwards.
export const maxDuration = 60;

function handle(userId?: string) {
  after(() => runWorker(userId).then(() => undefined).catch((error) => console.error("Job worker failed", error)));
  return Response.json({ ok: true }, { status: 202 });
}

export async function GET(request: Request) {
  if (!authorizedWorker(request)) return jsonError("Not found.", 404);
  return handle();
}

export async function POST(request: Request) {
  if (!authorizedWorker(request)) return jsonError("Not found.", 404);
  const body = await readJson(request);
  return handle(typeof body?.userId === "string" ? body.userId : undefined);
}

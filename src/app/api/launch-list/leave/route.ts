import { jsonError, readJson, str } from "@/lib/http";
import { leaveLaunchList } from "@/lib/launch-list";
import { clientKey, limits } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!limits.waitlist(clientKey(request))) return jsonError("Too many requests. Try again later.", 429);
  const body = await readJson(request);
  await leaveLaunchList(str(body?.token, 100));
  // The same answer for unknown links, so tokens can't be probed.
  return Response.json({ ok: true });
}

import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson, str, unauthorized } from "@/lib/http";
import { imagesEnabled, searchPhotos } from "@/lib/images";
import { clientKey, limits } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!imagesEnabled()) return jsonError("Photos aren't set up yet.", 503);
  if (!limits.outline(user.id) || !limits.outline(clientKey(request))) {
    return jsonError("Too many searches. Try again later.", 429);
  }
  const query = str((await readJson(request))?.query, 100);
  if (!query) return jsonError("Type what the photo should show.", 400);
  return Response.json({ photos: await searchPhotos(query, 9) });
}

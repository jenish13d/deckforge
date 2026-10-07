import { defaultCall, generateSetup } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson, str, unauthorized } from "@/lib/http";
import { clientCountry, clientKey, limits } from "@/lib/rate-limit";

export const maxDuration = 30;

/** Topic-specific choices (audience, angle) shown before the outline. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!limits.setup(user.id) || !limits.setup(clientKey(request))) {
    return jsonError("Too many requests. Try again later.", 429);
  }
  const body = await readJson(request);
  const prompt = str(body?.prompt, 4000);
  if (!prompt) return jsonError("Describe what the deck is about.", 400);
  try {
    return Response.json(await generateSetup(prompt, defaultCall, { region: clientCountry(request) }));
  } catch (error) {
    // The screen falls back to general choices; nothing is lost.
    console.error("Setup suggestions failed", error);
    return jsonError("Couldn't suggest choices.", 502);
  }
}

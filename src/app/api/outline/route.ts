import { GenerationError, generateOutline } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { MAX_CARDS, MIN_CARDS } from "@/lib/cards";
import { jsonError, readJson, str, unauthorized } from "@/lib/http";
import { clientKey, limits } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!limits.outline(user.id) || !limits.outline(clientKey(request))) {
    return jsonError("Too many requests. Try again later.", 429);
  }

  const body = await readJson(request);
  const prompt = str(body?.prompt, 4000);
  const cardCount = Number(body?.cardCount);
  if (!prompt) return jsonError("Describe what the deck is about.", 400);
  if (!Number.isInteger(cardCount) || cardCount < MIN_CARDS || cardCount > MAX_CARDS) {
    return jsonError(`Card count must be ${MIN_CARDS}-${MAX_CARDS}.`, 400);
  }

  try {
    return Response.json(await generateOutline(prompt, cardCount));
  } catch (error) {
    console.error("Outline generation failed", error);
    const message = error instanceof GenerationError ? error.message : "Couldn't create an outline. Please try again.";
    return jsonError(message, 502);
  }
}

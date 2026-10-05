import { GenerationError, defaultCall, generateOutline } from "@/lib/ai";
import { saveResearch } from "@/lib/decks";
import { AiBusyError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/auth";
import { MAX_CARDS, MIN_CARDS } from "@/lib/cards";
import { busyResponse, jsonError, readJson, str, unauthorized } from "@/lib/http";
import { clientCountry, clientKey, limits } from "@/lib/rate-limit";

// Research plus the outline can take a while.
export const maxDuration = 60;

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
    const { research, ...outline } = await generateOutline(prompt, cardCount, defaultCall, { region: clientCountry(request) });
    const researchId = await saveResearch(user.id, research);
    return Response.json({ ...outline, sources: research.sources, researchId });
  } catch (error) {
    if (error instanceof AiBusyError) {
      return busyResponse(
        error.daily ? error : { ...error, message: "The AI is busy right now (free plan limit). Please try again in a minute." },
      );
    }
    console.error("Outline generation failed", error);
    const message = error instanceof GenerationError ? error.message : "Couldn't create an outline. Please try again.";
    return jsonError(message, 502);
  }
}

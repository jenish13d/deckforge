import { GenerationError } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { chargeCredits, creditsOf, refundCredits } from "@/lib/credits";
import { db } from "@/lib/db";
import { generateDeckCard, ownsCard } from "@/lib/decks";
import { forbidden, jsonError, readJson, str, unauthorized } from "@/lib/http";
import { DEFAULT_MODE, MODES, canUseMode, cardCost, isModeId } from "@/lib/plans";
import { premiumAvailable } from "@/lib/providers";
import { clientKey, limits } from "@/lib/rate-limit";

// AI calls can take a while, especially in Premium mode.
export const maxDuration = 60;

export async function POST(request: Request, ctx: RouteContext<"/api/decks/[id]/cards/[cardId]/generate">) {
  const { id, cardId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await ownsCard(user.id, id, cardId))) return forbidden();
  if (!limits.card(user.id) || !limits.card(clientKey(request))) {
    return jsonError("Too many requests. Try again later.", 429);
  }

  const body = await readJson(request);
  const deck = await db.deck.findUniqueOrThrow({ where: { id }, select: { mode: true } });
  const mode = isModeId(body?.mode) ? body.mode : isModeId(deck.mode) ? deck.mode : DEFAULT_MODE;
  if (!canUseMode(user.plan, mode)) {
    return jsonError(`${MODES[mode].label} mode is part of Pro. Upgrade or pick another mode.`, 403);
  }

  if (mode === "premium" && !premiumAvailable()) {
    return jsonError("Premium mode is coming soon. Pick Quick or Standard.", 403);
  }

  const cost = cardCost(mode);
  if (!(await chargeCredits(user.id, cost))) {
    return jsonError("You're out of credits. Upgrade to Pro or wait for your monthly refill.", 402);
  }

  const extra = str(body?.instructions, 500);
  try {
    const card = await generateDeckCard(id, cardId, mode, extra || undefined);
    return Response.json({ card, credits: await creditsOf(user.id) });
  } catch (error) {
    await refundCredits(user.id, cost);
    console.error(`Card generation failed (${id}/${cardId})`, error);
    const message = error instanceof GenerationError ? error.message : "Couldn't write this card. Try again.";
    return jsonError(message, 502);
  }
}

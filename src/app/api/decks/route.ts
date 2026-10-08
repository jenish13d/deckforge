import { getCurrentUser } from "@/lib/auth";
import { MAX_CARDS } from "@/lib/cards";
import { createDeck, deleteDecks } from "@/lib/decks";
import { db } from "@/lib/db";
import { jsonError, readJson, str, unauthorized } from "@/lib/http";
import { dispatchJobs } from "@/lib/job-dispatch";
import { cancelJobs, ensureDeckJobs } from "@/lib/jobs";
import { DEFAULT_MODE, canUseDepth, canUseMode, isModeId } from "@/lib/plans";
import { isDepth } from "@/lib/ai";
import { premiumAvailable } from "@/lib/providers";
import { clientCountry, clientKey, limits } from "@/lib/rate-limit";
import { isThemeId } from "@/lib/themes";

// Writing the new deck starts right after this response, in this invocation.
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!limits.deck(user.id) || !limits.deck(clientKey(request))) {
    return jsonError("Too many decks created. Try again later.", 429);
  }

  const body = await readJson(request);
  const prompt = str(body?.prompt, 4000);
  const title = str(body?.title, 120) || "Untitled";
  const theme = isThemeId(body?.theme) ? body.theme : "minimal";
  const mode = isModeId(body?.mode) ? body.mode : DEFAULT_MODE;
  const outline = Array.isArray(body?.outline)
    ? body.outline
        .map((c: unknown) => {
          const card = (c ?? {}) as Record<string, unknown>;
          const points = Array.isArray(card.points) ? card.points.map((p) => str(p, 200)).filter(Boolean).slice(0, 5) : [];
          return { title: str(card.title, 120), points };
        })
        .filter((c: { title: string }) => c.title)
        .slice(0, MAX_CARDS)
    : [];
  if (!prompt) return jsonError("Missing prompt.", 400);
  if (outline.length === 0) return jsonError("The outline needs at least one card.", 400);
  if (!canUseMode(user.plan, mode)) return jsonError("Upgrade to Pro to use Premium mode.", 403);
  if (mode === "premium" && !premiumAvailable()) return jsonError("Premium mode is coming soon.", 403);
  const depth = isDepth(body?.depth) ? body.depth : "medium";
  if (!canUseDepth(user.plan, depth)) return jsonError("Low and High detail are part of Pro.", 403);

  const researchId = str(body?.researchId, 40) || null;
  const deck = await createDeck({ userId: user.id, title, prompt, theme, mode, depth, outline, researchId });
  // Start writing on the server now, so the deck keeps going even if the browser closes at once.
  // The editor asks again when it opens, which is harmless, so a failure here is not fatal.
  try {
    await ensureDeckJobs({ user, deckId: deck.id, region: clientCountry(request) });
    dispatchJobs({ userId: user.id });
  } catch (error) {
    console.error("Couldn't queue the new deck's cards", error);
  }
  return Response.json(deck, { status: 201 });
}

/** Deletes several decks at once: `{ ids: string[] }`. Only the user's own decks are deleted. */
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await readJson(request);
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x): x is string => typeof x === "string").slice(0, 500) : [];
  if (ids.length === 0) return jsonError("Choose at least one deck.", 400);
  // Jobs still waiting or running for these decks are cancelled, which returns their credits.
  const owned = await db.deck.findMany({ where: { userId: user.id, id: { in: ids } }, select: { id: true } });
  for (const { id } of owned) await cancelJobs({ deckId: id });
  return Response.json({ deleted: await deleteDecks(user.id, ids) });
}

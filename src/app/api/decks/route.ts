import { getCurrentUser } from "@/lib/auth";
import { MAX_CARDS } from "@/lib/cards";
import { createDeck } from "@/lib/decks";
import { jsonError, readJson, str, unauthorized } from "@/lib/http";
import { DEFAULT_MODE, canUseMode, isModeId } from "@/lib/plans";
import { premiumAvailable } from "@/lib/providers";
import { clientKey, limits } from "@/lib/rate-limit";
import { isThemeId } from "@/lib/themes";

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

  return Response.json(await createDeck({ userId: user.id, title, prompt, theme, mode, outline }), { status: 201 });
}

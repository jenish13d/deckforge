import { MAX_CARDS } from "@/lib/cards";
import { createDeck } from "@/lib/decks";
import { jsonError, readJson, str } from "@/lib/http";
import { clientKey, limits } from "@/lib/rate-limit";
import { isThemeId } from "@/lib/themes";

export async function POST(request: Request) {
  if (!limits.deck(clientKey(request))) return jsonError("Too many decks created. Try again later.", 429);

  const body = await readJson(request);
  const prompt = str(body?.prompt, 4000);
  const title = str(body?.title, 120) || "Untitled";
  const theme = isThemeId(body?.theme) ? body.theme : "minimal";
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

  return Response.json(await createDeck({ title, prompt, theme, outline }), { status: 201 });
}

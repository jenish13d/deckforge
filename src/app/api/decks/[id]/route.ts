import { canEdit, getDeck, reorderCards, updateDeck } from "@/lib/decks";
import { editToken, jsonError, readJson, str } from "@/lib/http";
import { isThemeId } from "@/lib/themes";

export async function GET(_request: Request, ctx: RouteContext<"/api/decks/[id]">) {
  const { id } = await ctx.params;
  const deck = await getDeck(id);
  return deck ? Response.json(deck) : jsonError("Deck not found.", 404);
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/decks/[id]">) {
  const { id } = await ctx.params;
  if (!(await canEdit(id, editToken(request)))) return jsonError("Not allowed to edit this deck.", 403);

  const body = await readJson(request);
  if (!body) return jsonError("Invalid JSON.", 400);

  const title = str(body.title, 120);
  await updateDeck(id, {
    ...(title ? { title } : {}),
    ...(isThemeId(body.theme) ? { theme: body.theme } : {}),
  });

  if (Array.isArray(body.order)) {
    try {
      await reorderCards(id, body.order.filter((x): x is string => typeof x === "string"));
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Invalid order.", 400);
    }
  }
  return Response.json(await getDeck(id));
}

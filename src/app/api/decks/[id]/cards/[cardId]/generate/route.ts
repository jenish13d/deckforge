import { GenerationError } from "@/lib/ai";
import { canEdit, generateDeckCard } from "@/lib/decks";
import { db } from "@/lib/db";
import { editToken, jsonError, readJson, str } from "@/lib/http";
import { clientKey, limits } from "@/lib/rate-limit";

export async function POST(request: Request, ctx: RouteContext<"/api/decks/[id]/cards/[cardId]/generate">) {
  const { id, cardId } = await ctx.params;
  if (!(await canEdit(id, editToken(request)))) return jsonError("Not allowed to edit this deck.", 403);
  if ((await db.card.count({ where: { id: cardId, deckId: id } })) !== 1) return jsonError("Card not found.", 404);
  if (!limits.card(clientKey(request))) return jsonError("Too many requests. Try again later.", 429);

  const extra = str((await readJson(request))?.instructions, 500);
  try {
    return Response.json(await generateDeckCard(id, cardId, extra || undefined));
  } catch (error) {
    console.error(`Card generation failed (${id}/${cardId})`, error);
    const message = error instanceof GenerationError ? error.message : "Couldn't write this card. Try again.";
    return jsonError(message, 502);
  }
}

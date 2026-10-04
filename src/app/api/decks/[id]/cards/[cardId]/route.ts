import { CardContentSchema } from "@/lib/cards";
import { canEdit, deleteCard, updateCardContent } from "@/lib/decks";
import { db } from "@/lib/db";
import { editToken, jsonError, readJson } from "@/lib/http";

type Ctx = RouteContext<"/api/decks/[id]/cards/[cardId]">;

async function authorized(request: Request, deckId: string, cardId: string): Promise<boolean> {
  if (!(await canEdit(deckId, editToken(request)))) return false;
  return (await db.card.count({ where: { id: cardId, deckId } })) === 1;
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { id, cardId } = await ctx.params;
  if (!(await authorized(request, id, cardId))) return jsonError("Not allowed to edit this card.", 403);

  const parsed = CardContentSchema.safeParse((await readJson(request))?.content);
  if (!parsed.success) return jsonError("Invalid card content.", 400);
  return Response.json(await updateCardContent(cardId, parsed.data));
}

export async function DELETE(request: Request, ctx: Ctx) {
  const { id, cardId } = await ctx.params;
  if (!(await authorized(request, id, cardId))) return jsonError("Not allowed to edit this card.", 403);
  await deleteCard(id, cardId);
  return new Response(null, { status: 204 });
}

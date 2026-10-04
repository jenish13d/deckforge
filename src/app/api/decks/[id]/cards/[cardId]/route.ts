import { getCurrentUser } from "@/lib/auth";
import { CardContentSchema } from "@/lib/cards";
import { deleteCard, ownsCard, updateCardContent } from "@/lib/decks";
import { forbidden, jsonError, readJson, unauthorized } from "@/lib/http";

type Ctx = RouteContext<"/api/decks/[id]/cards/[cardId]">;

export async function PATCH(request: Request, ctx: Ctx) {
  const { id, cardId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await ownsCard(user.id, id, cardId))) return forbidden();

  const parsed = CardContentSchema.safeParse((await readJson(request))?.content);
  if (!parsed.success) return jsonError("Invalid card content.", 400);
  return Response.json(await updateCardContent(cardId, parsed.data));
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id, cardId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await ownsCard(user.id, id, cardId))) return forbidden();
  await deleteCard(id, cardId);
  return new Response(null, { status: 204 });
}

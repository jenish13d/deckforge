import { addCard, canEdit } from "@/lib/decks";
import { editToken, jsonError, readJson, str } from "@/lib/http";

export async function POST(request: Request, ctx: RouteContext<"/api/decks/[id]/cards">) {
  const { id } = await ctx.params;
  if (!(await canEdit(id, editToken(request)))) return jsonError("Not allowed to edit this deck.", 403);

  const body = await readJson(request);
  const title = str(body?.title, 120);
  const afterPosition = Number(body?.afterPosition);
  if (!title) return jsonError("The new card needs a title.", 400);
  if (!Number.isInteger(afterPosition) || afterPosition < -1) return jsonError("Invalid position.", 400);

  return Response.json(await addCard(id, afterPosition, title), { status: 201 });
}

import { getCurrentUser } from "@/lib/auth";
import { addCard, ownsDeck } from "@/lib/decks";
import { forbidden, jsonError, readJson, str, unauthorized } from "@/lib/http";

export async function POST(request: Request, ctx: RouteContext<"/api/decks/[id]/cards">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await ownsDeck(user.id, id))) return forbidden();

  const body = await readJson(request);
  const title = str(body?.title, 120);
  const afterPosition = Number(body?.afterPosition);
  if (!title) return jsonError("The new card needs a title.", 400);
  if (!Number.isInteger(afterPosition) || afterPosition < -1) return jsonError("Invalid position.", 400);

  return Response.json(await addCard(id, afterPosition, title), { status: 201 });
}

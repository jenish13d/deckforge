import { getCurrentUser } from "@/lib/auth";
import { duplicateDeck } from "@/lib/decks";
import { forbidden, jsonError, unauthorized } from "@/lib/http";
import { clientKey, limits } from "@/lib/rate-limit";

export async function POST(request: Request, ctx: RouteContext<"/api/decks/[id]/duplicate">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!limits.deck(user.id) || !limits.deck(clientKey(request))) return jsonError("Too many decks created. Try again later.", 429);
  const copy = await duplicateDeck(user.id, id);
  return copy ? Response.json(copy, { status: 201 }) : forbidden();
}

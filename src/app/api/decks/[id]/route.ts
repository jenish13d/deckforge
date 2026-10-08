import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canView } from "@/lib/access";
import { canRemoveBadge, getDeck, ownsDeck, reorderCards, updateDeck } from "@/lib/decks";
import { isCreditsPlace } from "@/lib/slides";
import { forbidden, jsonError, readJson, str, unauthorized } from "@/lib/http";
import { cancelJobs } from "@/lib/jobs";
import { isThemeId } from "@/lib/themes";

export async function GET(_request: Request, ctx: RouteContext<"/api/decks/[id]">) {
  const { id } = await ctx.params;
  const [deck, user] = await Promise.all([getDeck(id), getCurrentUser()]);
  // Private decks look the same as missing ones to everyone but the owner.
  return deck && canView(deck, user?.id ?? null) ? Response.json(deck) : jsonError("Deck not found.", 404);
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/decks/[id]">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await ownsDeck(user.id, id))) return forbidden();

  const body = await readJson(request);
  if (!body) return jsonError("Invalid JSON.", 400);

  const title = str(body.title, 120);
  if (body.badge === false && !canRemoveBadge(user.plan)) {
    return jsonError("Removing the Slidezza badge is part of Pro.", 403);
  }
  await updateDeck(id, {
    ...(typeof body.badge === "boolean" ? { badge: body.badge } : {}),
    ...(typeof body.endSlide === "boolean" ? { endSlide: body.endSlide } : {}),
    ...(isCreditsPlace(body.credits) ? { credits: body.credits } : {}),
    ...(title ? { title } : {}),
    ...(isThemeId(body.theme) ? { theme: body.theme } : {}),
    ...(typeof body.shared === "boolean" ? { shared: body.shared } : {}),
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

export async function DELETE(_request: Request, ctx: RouteContext<"/api/decks/[id]">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await ownsDeck(user.id, id))) return forbidden();
  await cancelJobs({ deckId: id });
  await db.deck.delete({ where: { id } });
  return new Response(null, { status: 204 });
}

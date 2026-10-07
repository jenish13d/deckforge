import { assistDeck, defaultCall } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { getDeck, ownsDeck } from "@/lib/decks";
import { forbidden, jsonError, readJson, str, unauthorized } from "@/lib/http";
import { clientCountry, clientKey, limits } from "@/lib/rate-limit";
import { THEMES } from "@/lib/themes";
import { plainTitle } from "@/lib/cards";

export const maxDuration = 30;

/** The editor's assistant: reads a request and proposes changes; nothing changes until the user applies them. */
export async function POST(request: Request, ctx: RouteContext<"/api/decks/[id]/assist">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await ownsDeck(user.id, id))) return forbidden();
  if (!limits.assist(user.id) || !limits.assist(clientKey(request))) {
    return jsonError("Too many requests. Try again in a little while.", 429);
  }
  const body = await readJson(request);
  const message = str(body?.message, 1000);
  if (!message) return jsonError("Type what you'd like to change.", 400);
  const deck = await getDeck(id);
  if (!deck) return jsonError("Deck not found.", 404);
  try {
    const result = await assistDeck(
      {
        message,
        deckTitle: deck.title,
        slides: deck.cards.map((c) => ({ title: plainTitle(c.content?.title ?? c.brief.title), layout: c.content?.layout ?? "" })),
        themes: THEMES.map((t) => ({ id: t.id, name: t.name })),
        theme: deck.theme,
      },
      defaultCall,
      { region: clientCountry(request) },
    );
    return Response.json(result);
  } catch (error) {
    console.error("Assistant failed", error);
    return jsonError("The assistant couldn't answer just now. Please try again.", 502);
  }
}

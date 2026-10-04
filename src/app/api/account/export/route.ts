import { getCurrentUser } from "@/lib/auth";
import { CardContentSchema, parseStored } from "@/lib/cards";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/http";
import { SITE } from "@/lib/site";

/** Everything stored about the signed-in user, as a JSON file download. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const decks = await db.deck.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { cards: { orderBy: { position: "asc" } } },
  });
  const feedback = await db.feedback.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const data = {
    exportedAt: new Date().toISOString(),
    account: { email: user.email, plan: user.plan, credits: user.credits, createdAt: user.createdAt },
    decks: decks.map((d) => ({
      title: d.title,
      prompt: d.prompt,
      theme: d.theme,
      sharedWithLink: d.shared,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      cards: d.cards.map((c) => parseStored(CardContentSchema, c.content)),
    })),
    feedback: feedback.map((f) => ({ rating: f.rating, message: f.message, page: f.page, createdAt: f.createdAt })),
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${SITE.name.toLowerCase()}-my-data.json"`,
      "Cache-Control": "no-store",
    },
  });
}

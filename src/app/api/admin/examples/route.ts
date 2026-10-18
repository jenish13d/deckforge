import { after } from "next/server";

import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { publishExample, unpublishExample } from "@/lib/examples";
import { jsonError, readJson, str, unauthorized } from "@/lib/http";
import { indexNow } from "@/lib/indexnow";

async function admin() {
  const user = await getCurrentUser();
  return user && isAdminEmail(user.email) ? user : null;
}

/** Publishes one of the admin's decks as a public example page. */
export async function POST(request: Request) {
  const user = await admin();
  if (!user) return unauthorized();
  const body = await readJson(request);
  const result = await publishExample(str(body?.deckId, 40), user.id, str(body?.slug, 120));
  if (!result.ok) return jsonError(result.error, 400);
  after(() => indexNow([`/examples/${result.slug}`, "/examples"]));
  return Response.json({ slug: result.slug }, { status: 201 });
}

/** Takes an example page down (the deck itself stays). */
export async function DELETE(request: Request) {
  const user = await admin();
  if (!user) return unauthorized();
  const body = await readJson(request);
  if (!(await unpublishExample(str(body?.deckId, 40), user.id))) return jsonError("That example is already gone.", 400);
  return Response.json({ ok: true });
}

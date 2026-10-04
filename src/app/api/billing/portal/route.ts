import { getCurrentUser } from "@/lib/auth";
import { createPortalUrl } from "@/lib/billing";
import { jsonError, unauthorized } from "@/lib/http";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!user.stripeCustomerId) return jsonError("No billing account yet.", 400);
  const url = await createPortalUrl(user.stripeCustomerId, new URL(request.url).origin);
  return url ? Response.json({ url }) : jsonError("Payments aren't set up yet.", 503);
}

import { getCurrentUser } from "@/lib/auth";
import { createCheckoutUrl } from "@/lib/billing";
import { jsonError, unauthorized } from "@/lib/http";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.plan === "pro") return jsonError("You're already on Pro.", 400);
  const url = await createCheckoutUrl(user, new URL(request.url).origin);
  return url ? Response.json({ url }) : jsonError("Payments aren't set up yet.", 503);
}

import { getCurrentUser } from "@/lib/auth";
import { createCheckoutUrl } from "@/lib/billing";
import { jsonError, readJson, unauthorized } from "@/lib/http";
import { PLANS } from "@/lib/plans";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const plan = (await readJson(request))?.plan === "max" ? "max" : "pro";
  if (user.plan === plan) return jsonError(`You're already on ${PLANS[plan].label}.`, 400);
  // Switching between paid plans happens in the billing portal, which keeps one subscription.
  if (user.plan !== "free") return jsonError("Use Manage billing to switch plans.", 400);
  const url = await createCheckoutUrl(user, new URL(request.url).origin, plan);
  return url ? Response.json({ url }) : jsonError("Payments aren't set up yet.", 503);
}

import { getCurrentUser } from "@/lib/auth";
import { billingDemoEnabled, setPlan } from "@/lib/billing";
import { jsonError, readJson, unauthorized } from "@/lib/http";

// Switches plans without payment, for demos only (see billingDemoEnabled).
export async function POST(request: Request) {
  if (!billingDemoEnabled()) return jsonError("Not available.", 404);
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const plan = (await readJson(request))?.plan === "pro" ? "pro" : "free";
  await setPlan(user.id, plan);
  return Response.json({ plan });
}

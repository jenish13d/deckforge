import { getCurrentUser } from "@/lib/auth";
import { billingDemoEnabled, setPlan } from "@/lib/billing";
import { jsonError, readJson, unauthorized } from "@/lib/http";
import { isPaidPlan } from "@/lib/plans";

// Switches plans without payment, for demos only (see billingDemoEnabled).
export async function POST(request: Request) {
  if (!billingDemoEnabled()) return jsonError("Not available.", 404);
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const asked = (await readJson(request))?.plan;
  const plan = isPaidPlan(asked) ? asked : "free";
  await setPlan(user.id, plan);
  return Response.json({ plan });
}

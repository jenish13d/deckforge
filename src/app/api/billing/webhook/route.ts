import { handleStripeEvent, stripeClient } from "@/lib/billing";
import { jsonError } from "@/lib/http";

// Stripe calls this after checkout, on renewals and on cancellations.
export async function POST(request: Request) {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !secret) return jsonError("Billing not configured.", 503);
  if (!signature) return jsonError("Missing signature.", 400);

  let event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return jsonError("Invalid signature.", 400);
  }
  await handleStripeEvent(event);
  return Response.json({ received: true });
}

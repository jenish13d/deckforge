import "server-only";

import Stripe from "stripe";

import { allowance } from "./credits";
import { db } from "./db";

// Paid plans through Stripe Checkout (subscriptions). Needs STRIPE_SECRET_KEY,
// STRIPE_PRICE_PRO (a recurring price id) and STRIPE_WEBHOOK_SECRET.

let stripe: Stripe | null = null;

export function stripeClient(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

export const billingConfigured = () =>
  Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PRO && process.env.STRIPE_WEBHOOK_SECRET);

/**
 * Demo upgrade lets you show the Pro plan without Stripe. It is only ever on
 * when BILLING_DEMO=1 *and* Stripe is not configured, so it can't coexist with
 * real billing. Never set BILLING_DEMO on a public deployment.
 */
export const billingDemoEnabled = () => process.env.BILLING_DEMO === "1" && !process.env.STRIPE_SECRET_KEY;

export async function setPlan(
  userId: string,
  plan: "free" | "pro",
  extra: { stripeCustomerId?: string; stripeSubscriptionId?: string | null } = {},
): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { plan, ...allowance(plan), ...extra } });
}

export async function createCheckoutUrl(user: { id: string; email: string; stripeCustomerId: string | null }, origin: string) {
  const client = stripeClient();
  if (!client || !process.env.STRIPE_PRICE_PRO) return null;
  const session = await client.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_PRO, quantity: 1 }],
    client_reference_id: user.id,
    ...(user.stripeCustomerId ? { customer: user.stripeCustomerId } : { customer_email: user.email }),
    success_url: `${origin}/account?upgraded=1`,
    cancel_url: `${origin}/account`,
  });
  return session.url;
}

export async function createPortalUrl(customerId: string, origin: string) {
  const client = stripeClient();
  if (!client) return null;
  const session = await client.billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/account` });
  return session.url;
}

const idOf = (value: string | { id: string } | null): string | null =>
  typeof value === "string" ? value : (value?.id ?? null);

/** Applies a verified Stripe webhook event to our users. */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const customerId = idOf(session.customer);
      if (!userId || !customerId || session.mode !== "subscription") return;
      await setPlan(userId, "pro", { stripeCustomerId: customerId, stripeSubscriptionId: idOf(session.subscription) });
      return;
    }
    case "invoice.paid": {
      // Renewals refill Pro credits each billing period.
      const invoice = event.data.object;
      if (invoice.billing_reason !== "subscription_cycle") return;
      const customerId = idOf(invoice.customer);
      const user = customerId ? await db.user.findUnique({ where: { stripeCustomerId: customerId } }) : null;
      if (user?.plan === "pro") await setPlan(user.id, "pro");
      return;
    }
    case "customer.subscription.deleted": {
      const customerId = idOf(event.data.object.customer);
      const user = customerId ? await db.user.findUnique({ where: { stripeCustomerId: customerId } }) : null;
      if (user) await setPlan(user.id, "free", { stripeSubscriptionId: null });
      return;
    }
  }
}

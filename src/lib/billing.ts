import "server-only";

import Stripe from "stripe";

import { allowance } from "./credits";
import { db } from "./db";
import { type PaidPlanId, type PlanId, isPaidPlan } from "./plans";

const priceFor = (plan: PaidPlanId) => (plan === "max" ? process.env.STRIPE_PRICE_MAX : process.env.STRIPE_PRICE_PRO);

/** The plan a Stripe price belongs to. */
function planForPrice(priceId: string | undefined): PaidPlanId | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_MAX) return "max";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return null;
}

/** Max can be bought once its Stripe price is set up too. */
export const maxConfigured = () => billingConfigured() && Boolean(process.env.STRIPE_PRICE_MAX);

// Paid plans through Stripe Checkout (subscriptions). Needs STRIPE_SECRET_KEY,
// STRIPE_PRICE_PRO (a recurring price id), STRIPE_WEBHOOK_SECRET, and STRIPE_PRICE_MAX for Max.

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
  plan: PlanId,
  extra: { stripeCustomerId?: string; stripeSubscriptionId?: string | null } = {},
  /** Credits left from the period that just ended (kept on plans with rollover). */
  unused = 0,
): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { plan, ...allowance(plan, new Date(), unused), ...extra } });
}

export async function createCheckoutUrl(
  user: { id: string; email: string; stripeCustomerId: string | null },
  origin: string,
  plan: PaidPlanId = "pro",
) {
  const client = stripeClient();
  const price = priceFor(plan);
  if (!client || !price) return null;
  const session = await client.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    metadata: { plan },
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
      const plan = isPaidPlan(session.metadata?.plan) ? session.metadata.plan : "pro";
      await setPlan(userId, plan, { stripeCustomerId: customerId, stripeSubscriptionId: idOf(session.subscription) });
      return;
    }
    case "customer.subscription.updated": {
      // A switch between Pro and Max in the billing portal.
      const subscription = event.data.object;
      const plan = planForPrice(subscription.items.data[0]?.price?.id);
      const customerId = idOf(subscription.customer);
      const user = customerId ? await db.user.findUnique({ where: { stripeCustomerId: customerId } }) : null;
      if (user && plan && subscription.status === "active" && user.plan !== plan) await setPlan(user.id, plan);
      return;
    }
    case "invoice.paid": {
      // Renewals refill Pro credits each billing period.
      const invoice = event.data.object;
      if (invoice.billing_reason !== "subscription_cycle") return;
      const customerId = idOf(invoice.customer);
      const user = customerId ? await db.user.findUnique({ where: { stripeCustomerId: customerId } }) : null;
      if (user && isPaidPlan(user.plan)) await setPlan(user.id, user.plan, {}, user.credits);
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

import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { PlanActions } from "@/components/PlanActions";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { billingConfigured, billingDemoEnabled } from "@/lib/billing";
import { MODES, PLANS, planOf } from "@/lib/plans";

export const metadata = { title: "Account" };

export default async function AccountPage(props: PageProps<"/account">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const upgraded = (await props.searchParams).upgraded === "1";
  const plan = planOf(user.plan);
  const current = PLANS[plan];

  return (
    <>
      <SiteHeader />
      <main className="page page--narrow">
        <h1 className="page-title">Account</h1>
        {upgraded && <p className="success" role="status">Thanks! Your Pro plan is active.</p>}
        {user.credits === 0 && !upgraded && (
          <p className="banner" role="alert">
            You&apos;ve used all your credits for this month. They refill on{" "}
            {user.creditsResetAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {plan === "free" && <>, or <a href="#upgrade">upgrade to Pro</a> for {PLANS.pro.monthlyCredits.toLocaleString()} credits a month</>}.
          </p>
        )}

        <section className="panel">
          <div className="row row--between">
            <div>
              <p className="muted small">Signed in as</p>
              <p className="strong">{user.email}</p>
            </div>
            <div className="text-right">
              <p className="muted small">Plan</p>
              <p className="strong">{current.label}</p>
            </div>
          </div>
          <div className="credit-meter">
            <div className="row row--between">
              <span className="strong">{user.credits} credits left</span>
              <span className="muted small">
                Refills to {current.monthlyCredits.toLocaleString()} on{" "}
                {user.creditsResetAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="credit-meter__bar" role="presentation">
              <span style={{ width: `${Math.min(100, (user.credits / current.monthlyCredits) * 100)}%` }} />
            </div>
          </div>
          <p className="muted small">
            A card costs {MODES.quick.creditsPerCard} credit in {MODES.quick.label}, {MODES.standard.creditsPerCard} in{" "}
            {MODES.standard.label} and {MODES.premium.creditsPerCard} in {MODES.premium.label}. Failed cards are refunded.
          </p>
        </section>

        <section className="pricing__plans">
          {(["free", "pro"] as const).map((id) => (
            <div key={id} className={`plan${id === "pro" ? " plan--highlight" : ""}${id === plan ? " plan--current" : ""}`}>
              <h3>{PLANS[id].label} · {PLANS[id].price}</h3>
              <p>{PLANS[id].monthlyCredits.toLocaleString()} credits every month</p>
              <p>Modes: {PLANS[id].modes.map((m) => MODES[m].label).join(", ")}</p>
              {id === plan && <p className="badge">Current plan</p>}
            </div>
          ))}
        </section>

        <PlanActions
          plan={plan}
          billing={billingConfigured()}
          demo={billingDemoEnabled()}
          hasCustomer={Boolean(user.stripeCustomerId)}
          onWaitlist={Boolean(user.proWaitlistAt)}
        />

        <section className="section section--tight">
          <ChangePasswordForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

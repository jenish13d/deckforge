import { redirect } from "next/navigation";

import { AccountDataActions } from "@/components/AccountDataActions";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { LogoutButton } from "@/components/LogoutButton";
import { PlanActions } from "@/components/PlanActions";
import { AppShell } from "@/components/app/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { billingConfigured, billingDemoEnabled, maxConfigured } from "@/lib/billing";
import { MODES, PLANS, PLAN_IDS, planOf } from "@/lib/plans";
import { onWaitlist } from "@/lib/waitlist";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { title: "Account", robots: PRIVATE_ROBOTS };

export default async function AccountPage(props: PageProps<"/account">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const upgraded = (await props.searchParams).upgraded === "1";
  const plan = planOf(user.plan);
  const current = PLANS[plan];

  return (
    <AppShell next="/account">
      <div className="page page--narrow">
        <div className="row row--between page-head">
          <h1 className="page-title">Account</h1>
          <LogoutButton className="button" />
        </div>
        {upgraded && <p className="success" role="status">Grazie! Your Pro plan is active.</p>}
        {user.credits === 0 && !upgraded && (
          <p className="banner" role="alert">
            You&apos;ve used all your credits for this month. They refill on{" "}
            {user.creditsResetAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {plan === "free" && <>, or <a href="#upgrade">upgrade to Pro</a> for {PLANS.pro.monthlyCredits.toLocaleString()} credits a month</>}.
          </p>
        )}

        <section className="account-hero">
          <div className="account-hero__who">
            <span className="avatar avatar--large" aria-hidden="true">{user.email.charAt(0).toUpperCase()}</span>
            <div className="account-hero__text">
              <p className="account-hero__email">{user.email}</p>
              <p className="account-hero__plan">{current.label} plan</p>
            </div>
          </div>
          <div className="account-hero__credits">
            <p className="account-hero__number">
              {user.credits.toLocaleString("en-US")}
              <span> / {current.monthlyCredits.toLocaleString("en-US")} credits</span>
            </p>
            <div className="credit-meter__bar" role="presentation">
              <span style={{ width: `${Math.min(100, (user.credits / current.monthlyCredits) * 100)}%` }} />
            </div>
            <p className="account-hero__note">
              Refills on {user.creditsResetAt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}.
              {" "}A card costs {MODES.quick.creditsPerCard} credit in {MODES.quick.label}, {MODES.standard.creditsPerCard} in{" "}
              {MODES.standard.label} and {MODES.premium.creditsPerCard} in {MODES.premium.label}. Failed cards are refunded.
            </p>
          </div>
        </section>

        <section className="pricing__plans">
          {PLAN_IDS.map((id) => (
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
          maxBilling={maxConfigured()}
          demo={billingDemoEnabled()}
          hasCustomer={Boolean(user.stripeCustomerId)}
          onWaitlist={Boolean(await onWaitlist(user.email))}
        />

        <section className="section section--tight">
          <ChangePasswordForm />
        </section>

        <div className="section section--tight">
          <AccountDataActions />
        </div>
      </div>
    </AppShell>
  );
}

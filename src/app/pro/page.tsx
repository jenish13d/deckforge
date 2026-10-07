import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { WaitlistForm } from "@/components/WaitlistForm";
import { getCurrentUser } from "@/lib/auth";
import { billingConfigured } from "@/lib/billing";
import { captchaEnabled } from "@/lib/captcha";
import { PLANS, isPaidPlan, type PaidPlanId } from "@/lib/plans";
import { SITE } from "@/lib/site";
import { onWaitlist } from "@/lib/waitlist";

export const metadata = {
  title: "Pro and Max are opening soon",
  description: `Get one email when ${SITE.name} Pro and Max open: more credits, PowerPoint download, all detail levels and no badge.`,
  alternates: { canonical: "/pro" },
};

const PAID: PaidPlanId[] = ["pro", "max"];

export default async function ProPage(props: PageProps<"/pro">) {
  const user = await getCurrentUser();
  // Once payments are open, "Get Pro" goes straight to checkout.
  if (billingConfigured()) redirect(user ? "/account#upgrade" : `/signup?next=${encodeURIComponent("/account#upgrade")}`);

  const params = await props.searchParams;
  const initialPlan = isPaidPlan(params.plan) ? params.plan : "pro";
  const joined = user ? await onWaitlist(user.email) : null;

  return (
    <>
      <SiteHeader />
      <main id="main" className="page page--narrow pro-page">
        <header className="hero hero--compact">
          <p className="eyebrow">Opening soon</p>
          <h1 className="hero__title hero__title--small">Pro and Max are almost here</h1>
          <p className="hero__subtitle">
            Leave your email and you&apos;ll hear first. Until then, the Free plan gives you {PLANS.free.monthlyCredits} credits every month.
          </p>
        </header>
        <WaitlistForm
          plans={PAID.map((id) => ({ id, label: PLANS[id].label, price: PLANS[id].price, credits: PLANS[id].monthlyCredits }))}
          initialPlan={initialPlan}
          accountEmail={user?.email}
          joined={joined}
          captcha={captchaEnabled()}
        />
        <ul className="pro-page__perks">
          <li>PowerPoint (.pptx) download you can edit</li>
          <li>Low, Medium and High detail</li>
          <li>Premium mode for pitches and client work</li>
          <li>No &ldquo;Made with {SITE.name}&rdquo; badge</li>
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}

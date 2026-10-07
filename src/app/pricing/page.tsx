import { Faq } from "@/components/landing/Faq";
import { Pricing } from "@/components/landing/Pricing";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { PLAN_IDS, PLANS } from "@/lib/plans";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Pricing",
  description: `${SITE.name} pricing: ${PLAN_IDS.map((id) => `${PLANS[id].label} ${PLANS[id].price} with ${PLANS[id].monthlyCredits.toLocaleString("en-US")} credits a month`).join("; ")}. Outlines are free; failed slides are refunded.`,
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader />
      <main id="main" className="page">
        <header className="hero hero--compact">
          <h1 className="hero__title hero__title--small">Simple pricing</h1>
          <p className="hero__subtitle">Start free. Upgrade when you present every week.</p>
        </header>
        <Pricing ctaHref={user ? "/account#upgrade" : "/signup"} />
        <section className="section">
          <h2 className="section-heading center">Questions</h2>
          <Faq />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";

import { CreateFlow } from "@/components/CreateFlow";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { MODES, MODE_IDS, PLANS, planOf } from "@/lib/plans";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader />
      <main className="page page--narrow">
        <header className="hero">
          <h1 className="hero__title">Ideas to slides in a minute</h1>
          <p className="hero__subtitle">Describe your idea. Deckforge plans it, writes it and designs it. Then make it yours.</p>
        </header>

        {user ? (
          <CreateFlow allowedModes={PLANS[planOf(user.plan)].modes} credits={user.credits} />
        ) : (
          <>
            <div className="row row--center">
              <Link href="/signup" className="button button--primary button--large">Start free</Link>
              <Link href="/login" className="button button--large">Log in</Link>
            </div>

            <section className="feature-grid">
              <div className="feature"><strong>📝 Prompt to deck</strong><span>Type a topic or paste notes. Edit the outline, then watch the cards appear.</span></div>
              <div className="feature"><strong>🎨 One-click themes</strong><span>Six designs. Switch any time, every card updates.</span></div>
              <div className="feature"><strong>✏️ Edit anything</strong><span>Rewrite a card with one instruction, or edit it by hand.</span></div>
              <div className="feature"><strong>🎤 Present & share</strong><span>Full-screen mode, a share link, or a PDF.</span></div>
            </section>

            <section className="pricing" aria-labelledby="pricing-title">
              <h2 id="pricing-title" className="section-title">Pick the quality you need</h2>
              <div className="pricing__modes">
                {MODE_IDS.map((id) => (
                  <div key={id} className="feature">
                    <strong>{MODES[id].icon} {MODES[id].label}</strong>
                    <span>{MODES[id].description}</span>
                    <span className="muted">{MODES[id].creditsPerCard} credit{MODES[id].creditsPerCard === 1 ? "" : "s"} per card</span>
                  </div>
                ))}
              </div>
              <div className="pricing__plans">
                <div className="plan">
                  <h3>{PLANS.free.label} · {PLANS.free.price}</h3>
                  <p>{PLANS.free.monthlyCredits} credits every month. Quick and Standard modes.</p>
                </div>
                <div className="plan plan--highlight">
                  <h3>{PLANS.pro.label} · {PLANS.pro.price}</h3>
                  <p>{PLANS.pro.monthlyCredits.toLocaleString()} credits every month. All modes including Premium.</p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}

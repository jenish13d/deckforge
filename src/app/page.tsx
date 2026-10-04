import Link from "next/link";

import { CreateFlow } from "@/components/CreateFlow";
import { DeckGrid } from "@/components/DeckGrid";
import { Faq } from "@/components/landing/Faq";
import { HeroPreview } from "@/components/landing/HeroPreview";
import { Pricing } from "@/components/landing/Pricing";
import { TemplateGallery } from "@/components/landing/TemplateGallery";
import { ThemeShowcase } from "@/components/landing/ThemeShowcase";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { listDecks } from "@/lib/decks";
import { availableModes, premiumAvailable } from "@/lib/providers";
import { SITE } from "@/lib/site";
import { findTemplate } from "@/lib/templates";

const signupFor = (templateId: string) => `/signup?next=${encodeURIComponent(`/?template=${templateId}`)}`;

export default async function Home(props: PageProps<"/">) {
  const user = await getCurrentUser();

  if (user) {
    const template = findTemplate(String((await props.searchParams).template ?? ""));
    const recent = await listDecks(user.id, 4);
    return (
      <>
        <SiteHeader />
        <main className="page page--narrow">
          <header className="hero hero--compact">
            <h1 className="hero__title hero__title--small">What do you want to present?</h1>
            <p className="hero__subtitle">Describe it, or start from a template below.</p>
          </header>
          <CreateFlow
            allowedModes={availableModes(user.plan)}
            comingSoon={premiumAvailable() ? [] : ["premium"]}
            credits={user.credits}
            initialPrompt={template?.prompt}
            initialTheme={template?.theme}
          />
          {recent.length > 0 && (
            <section className="section">
              <div className="row row--between">
                <h2 className="section-heading">Recent decks</h2>
                <Link href="/decks">View all</Link>
              </div>
              <DeckGrid decks={recent} />
            </section>
          )}
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section className="landing-hero">
          <div className="landing-hero__text">
            <p className="eyebrow">AI presentation maker</p>
            <h1 className="hero__title">{SITE.tagline}</h1>
            <p className="hero__subtitle hero__subtitle--left">{SITE.description}</p>
            <div className="row">
              <Link href="/signup" className="button button--primary button--large">Start free</Link>
              <Link href="#how" className="button button--large">See how it works</Link>
            </div>
            <p className="muted small">Free plan · No credit card needed</p>
          </div>
          <HeroPreview />
        </section>

        <div className="page">
          <section id="how" className="section">
            <h2 className="section-heading center">From idea to deck in three steps</h2>
            <ol className="steps">
              <li className="step">
                <span className="step__number">1</span>
                <strong>Describe it</strong>
                <span className="muted">Type a topic, paste notes, or pick a template.</span>
              </li>
              <li className="step">
                <span className="step__number">2</span>
                <strong>Shape the outline</strong>
                <span className="muted">Review the AI&apos;s plan. Rename, reorder, add or cut cards.</span>
              </li>
              <li className="step">
                <span className="step__number">3</span>
                <strong>Get your deck</strong>
                <span className="muted">Cards are written and designed for you. Edit, present, share.</span>
              </li>
            </ol>
          </section>

          <section id="templates" className="section">
            <h2 className="section-heading center">Start from a template</h2>
            <p className="muted center">Pick one, fill in your details, and the AI does the rest.</p>
            <TemplateGallery hrefFor={signupFor} />
          </section>

          <section id="themes" className="section">
            <h2 className="section-heading center">Six themes, one click</h2>
            <p className="muted center">Switch the look of every card at once, any time.</p>
            <ThemeShowcase />
          </section>

          <section className="section">
            <h2 className="section-heading center">Everything you need to present</h2>
            <div className="feature-grid feature-grid--three">
              <div className="feature"><strong>✏️ Edit anything</strong><span>Change text by hand or rewrite one card with an instruction.</span></div>
              <div className="feature"><strong>🧩 Smart layouts</strong><span>Bullets, columns, big numbers, timelines and quotes, picked per card.</span></div>
              <div className="feature"><strong>🎤 Present mode</strong><span>Full-screen slides with keyboard controls.</span></div>
              <div className="feature"><strong>🔗 Share links</strong><span>Send a view-only link. No account needed to view.</span></div>
              <div className="feature"><strong>📄 PDF download</strong><span>One slide per page, ready to email or print.</span></div>
              <div className="feature"><strong>🌍 Any language</strong><span>Write your prompt in your language; your deck follows.</span></div>
            </div>
          </section>

          <section id="pricing" className="section">
            <h2 className="section-heading center">Simple pricing</h2>
            <p className="muted center">Start free. Upgrade when you present every week.</p>
            <Pricing />
          </section>

          <section id="faq" className="section">
            <h2 className="section-heading center">Questions</h2>
            <Faq />
          </section>

          <section className="cta-band">
            <h2>Your next deck, done in minutes</h2>
            <Link href="/signup" className="button button--primary button--large">Start free</Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

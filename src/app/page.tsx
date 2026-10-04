import { Download, Languages, LayoutPanelTop, Link2, ListChecks, PenLine, Presentation, Shapes, WandSparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app/AppShell";
import { HeroArt } from "@/components/art/HeroArt";
import { CreateFlow } from "@/components/CreateFlow";
import { DeckGrid } from "@/components/DeckGrid";
import { Faq } from "@/components/landing/Faq";
import { Pricing } from "@/components/landing/Pricing";
import { TemplateGallery } from "@/components/landing/TemplateGallery";
import { ThemeShowcase } from "@/components/landing/ThemeShowcase";
import { TryPrompt } from "@/components/landing/TryPrompt";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TemplateIcon } from "@/components/TemplateIcon";
import { getCurrentUser } from "@/lib/auth";
import { listDecks } from "@/lib/decks";
import { availableModes, premiumAvailable } from "@/lib/providers";
import { SITE } from "@/lib/site";
import { TEMPLATES, findTemplate } from "@/lib/templates";

interface Point {
  icon: LucideIcon;
  title: string;
  text: string;
}

const STEPS: Point[] = [
  { icon: PenLine, title: "Describe it", text: "Type a topic, paste notes, or pick a template." },
  { icon: ListChecks, title: "Shape the outline", text: "Review the plan. Rename, reorder, add or cut cards." },
  { icon: Presentation, title: "Get your deck", text: "Cards are written and designed for you. Edit, present, share." },
];

const FEATURES: Point[] = [
  { icon: WandSparkles, title: "Edit anything", text: "Change text by hand or rewrite one card with an instruction." },
  { icon: Shapes, title: "Smart layouts", text: "Bullets, columns, big numbers, timelines and quotes." },
  { icon: LayoutPanelTop, title: "Present mode", text: "Full-screen slides with keyboard controls." },
  { icon: Link2, title: "Share links", text: "Send a view-only link. No account needed to view." },
  { icon: Download, title: "PDF and PowerPoint", text: "Download your deck to email, print or edit." },
  { icon: Languages, title: "Any language", text: "Write your prompt in your language; your deck follows." },
];

const signupFor = (templateId: string) => `/signup?next=${encodeURIComponent(`/?template=${templateId}`)}`;

export default async function Home(props: PageProps<"/">) {
  const user = await getCurrentUser();

  if (user) {
    const params = await props.searchParams;
    const template = findTemplate(String(params.template ?? ""));
    const sharedPrompt = typeof params.prompt === "string" ? params.prompt.slice(0, 1000) : undefined;
    const recent = await listDecks(user.id, 4);
    return (
      <AppShell>
        <div className="create-page">
          <CreateFlow
            allowedModes={availableModes(user.plan)}
            comingSoon={premiumAvailable() ? [] : ["premium"]}
            credits={user.credits}
            greetingName={user.email.split("@")[0]}
            initialPrompt={template?.prompt ?? sharedPrompt}
            initialTheme={template?.theme}
          />
          {recent.length > 0 && (
            <section className="section section--tight">
              <div className="row row--between">
                <h2 className="section-title">Recent decks</h2>
                <Link href="/decks">View all</Link>
              </div>
              <DeckGrid decks={recent} />
            </section>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section className="landing-top">
          <HeroArt className="landing-top__art" />
          <p className="eyebrow">AI presentation maker</p>
          <h1 className="landing-top__title">Beautiful slides, <em>in a minute</em></h1>
          <p className="landing-top__subtitle">{SITE.description}</p>
          <TryPrompt />
          <div className="quick-chips" aria-label="Start from a template">
            {TEMPLATES.map((t) => (
              <Link key={t.id} href={signupFor(t.id)} className="quick-chip">
                <TemplateIcon id={t.id} /> {t.name}
              </Link>
            ))}
          </div>
        </section>

        <div className="page">
          <section id="templates" className="section section--first">
            <h2 className="section-heading center">See what it makes</h2>
            <p className="muted center">Real cards made by {SITE.name}. Pick one to start.</p>
            <TemplateGallery hrefFor={signupFor} scroll />
          </section>

          <section id="how" className="section">
            <h2 className="section-heading center">From idea to deck in three steps</h2>
            <ol className="steps">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="step">
                  <span className="step__icon" aria-hidden="true"><Icon size={22} /></span>
                  <span className="step__text">
                    <strong>{i + 1}. {title}</strong>
                    <span className="muted">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section id="themes" className="section">
            <h2 className="section-heading center">Eight themes, one click</h2>
            <p className="muted center">Switch the look of every card at once, any time.</p>
            <ThemeShowcase />
          </section>

          <section className="section">
            <h2 className="section-heading center">Everything you need to present</h2>
            <div className="feature-grid feature-grid--three">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="feature">
                  <span className="feature__icon" aria-hidden="true"><Icon size={20} /></span>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="pricing" className="section">
            <h2 className="section-heading center">Simple pricing</h2>
            <p className="muted center">Start free. Upgrade when you present every week.</p>
            <Pricing compact />
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

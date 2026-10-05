import { BadgeCheck, Download, ImageIcon, Languages, LayoutPanelTop, Link2, Shapes, WandSparkles, X, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app/AppShell";
import { CreateFlow } from "@/components/CreateFlow";
import { DeckLibrary } from "@/components/DeckLibrary";
import { BuildStory } from "@/components/landing/BuildStory";
import { Faq } from "@/components/landing/Faq";
import { HeroStage } from "@/components/landing/HeroStage";
import { Pricing } from "@/components/landing/Pricing";
import { TemplateGallery } from "@/components/landing/TemplateGallery";
import { ThemeShowcase } from "@/components/landing/ThemeShowcase";
import { TiltZone } from "@/components/landing/TiltZone";
import { TryPrompt } from "@/components/landing/TryPrompt";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StructuredData } from "@/components/StructuredData";
import { TemplateIcon } from "@/components/TemplateIcon";
import { getCurrentUser } from "@/lib/auth";
import { listDecks } from "@/lib/decks";
import { availableModes, premiumAvailable } from "@/lib/providers";
import { SITE } from "@/lib/site";
import { TEMPLATES, findTemplate } from "@/lib/templates";
import { THEMES } from "@/lib/themes";

interface Point {
  icon: LucideIcon;
  title: string;
  text: string;
}

// The two promises other AI slide makers don't make get the big tiles.
const CHECKED = [
  { value: "189 m", where: "Wikipedia · Britannica", ok: true },
  { value: "AD 80", where: "Wikipedia · Britannica", ok: true },
  { value: "100–300", where: "No source, removed", ok: false },
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
              <DeckLibrary decks={recent} />
            </section>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <>
      <SiteHeader />
      <StructuredData />
      <main id="main">
        <section className="hero3d">
          <div className="hero3d__copy">
            <p className="eyebrow">AI presentation maker</p>
            <h1 className="landing-top__title">Beautiful slides, <em>in a minute</em></h1>
            <p className="landing-top__subtitle">{SITE.description}</p>
            <TryPrompt />
            <div className="quick-chips" role="group" aria-label="Start from a template">
              {TEMPLATES.map((t) => (
                <Link key={t.id} href={signupFor(t.id)} className="quick-chip">
                  <TemplateIcon id={t.id} /> {t.name}
                </Link>
              ))}
            </div>
          </div>
          <HeroStage />
        </section>

        <div className="page">
          <section id="templates" className="section section--first">
            <h2 className="section-heading center">See what it makes</h2>
            <p className="muted center">Real cards made by {SITE.name}. Pick one to start.</p>
            <TemplateGallery hrefFor={signupFor} scroll />
          </section>
        </div>

        <BuildStory />

        <div className="page">
          <section id="themes" className="section">
            <h2 className="section-heading center">{THEMES.length} themes, one click</h2>
            <p className="muted center">Switch the look of every card at once, any time.</p>
            <ThemeShowcase />
          </section>

          <section className="section">
            <h2 className="section-heading center">Everything you need to present</h2>
            <TiltZone className="bento">
              <article className="bento__tile bento__tile--facts tilt">
                <span className="feature__icon" aria-hidden="true"><BadgeCheck size={20} /></span>
                <strong>Every number checked</strong>
                <span>Facts come from real sources. A number goes on a slide only when the sources back it up, and the sources are listed under your deck.</span>
                <ul className="fact-list" aria-label="Example checks">
                  {CHECKED.map((c) => (
                    <li key={c.value} className={c.ok ? "fact-list__row" : "fact-list__row fact-list__row--cut"}>
                      {c.ok ? <BadgeCheck size={16} aria-label="Checked" /> : <X size={16} aria-label="Removed" />}
                      <b>{c.value}</b>
                      <span>{c.where}</span>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="bento__tile bento__tile--photo tilt">
                <span className="feature__icon" aria-hidden="true"><ImageIcon size={20} /></span>
                <strong>The right photo, never cut</strong>
                <span>Free-licence photos matched to the right person or place, shown whole.</span>
              </article>
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <article key={title} className="bento__tile tilt">
                  <span className="feature__icon" aria-hidden="true"><Icon size={20} /></span>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </article>
              ))}
            </TiltZone>
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

import { BadgeCheck, Download, FileUp, ImageIcon, Languages, LayoutPanelTop, Link2, Shapes, WandSparkles, X, type LucideIcon } from "lucide-react";
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
import { PLANS, planOf } from "@/lib/plans";
import { availableModes, premiumAvailable } from "@/lib/providers";
import { CLUSTERS, findGuide } from "@/lib/search-pages";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { TEMPLATES, findTemplate } from "@/lib/templates";
import { THEMES } from "@/lib/themes";

export const metadata = pageMetadata({
  title: `AI Presentation Maker | Create Beautiful PPTs with ${SITE.name}`,
  description: SITE.seoDescription,
  path: "/",
  absoluteTitle: true,
});

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
  { icon: FileUp, title: "Build from your files", text: "Attach a PDF, Word, PowerPoint, Excel file or a photo of your notes." },
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
            allowedDepths={PLANS[planOf(user.plan)].depths}
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
            <h1 className="landing-top__title">Create stunning presentations <em>with AI</em></h1>
            <p className="landing-top__subtitle">
              {SITE.name} is an AI presentation maker that turns your ideas, prompts and files into designed slides in minutes. Sources are listed and numbers are checked.
            </p>
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

          <section id="guides" className="section">
            <h2 className="section-heading center">What do you want to make?</h2>
            <p className="muted center">
              {SITE.name} works as an AI presentation maker and an AI PPT maker: describe a topic or attach your files and get a designed, editable deck. Pick the guide that matches what you need, or read <Link href="/how-it-works">how it works</Link> and <Link href="/features">what it can do</Link>.
            </p>
            <div className="guide-groups">
              {CLUSTERS.map((cluster) => (
                <div key={cluster.name} className="guide-groups__col">
                  <h3 className="use-case__group-title">{cluster.name}</h3>
                  <ul className="guide-groups__list">
                    {cluster.paths.map((path) => (
                      <li key={path}>
                        <Link href={path}>{findGuide(path)?.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
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

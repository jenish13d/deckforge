import Link from "next/link";

import { LaunchListForm } from "./LaunchListForm";
import { Logo } from "./Logo";
import { SITE } from "@/lib/site";

/** The home page before launch (PRELAUNCH=1): what's coming, and a list to hear when it opens. */
export function ComingSoon({ captcha }: { captcha: boolean }) {
  return (
    <>
      <header className="site-header">
        <Link href="/" className="site-header__brand" aria-label={`${SITE.name} home`}><Logo /></Link>
        <nav className="site-header__nav">
          <Link href="/login">Log in</Link>
        </nav>
      </header>
      <main id="main" className="page page--narrow pro-page coming-soon">
        <header className="hero hero--compact">
          <p className="eyebrow">Opening soon</p>
          <h1 className="hero__title hero__title--small">{SITE.tagline}, almost here</h1>
          <p className="hero__subtitle">{SITE.description}</p>
        </header>
        <LaunchListForm captcha={captcha} />
        <ul className="pro-page__perks">
          <li>Build a deck from a topic, notes or your own files</li>
          <li>Numbers checked against the sources it finds, with the sources listed</li>
          <li>Download as PDF (PowerPoint on Pro), present online or share a link</li>
          <li>A Free plan with no card</li>
        </ul>
        <p className="muted small coming-soon__links">
          Have an invite code? <Link href="/signup">Sign up with it</Link>. · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
        </p>
      </main>
    </>
  );
}

import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { Logo } from "./Logo";

export async function SiteFooter() {
  const user = await getCurrentUser();
  return (
    <footer className="site-footer no-print">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Logo />
          <p className="muted small">{SITE.description}</p>
        </div>
        <nav className="site-footer__col" aria-label="Product">
          <strong>Product</strong>
          <Link href="/templates">Templates</Link>
          <Link href="/features">Features</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>
        <nav className="site-footer__col" aria-label="AI presentation tools">
          <strong>AI presentations</strong>
          <Link href="/ai-presentation-maker">AI presentation maker</Link>
          <Link href="/ai-ppt-maker">AI PPT maker</Link>
          <Link href="/ai-powerpoint-generator">AI PowerPoint generator</Link>
          <Link href="/presentation-maker">Presentation maker</Link>
        </nav>
        <nav className="site-footer__col" aria-label="Use cases">
          <strong>Use cases</strong>
          <Link href="/presentation-maker-for-students">For students</Link>
          <Link href="/business-presentation-maker">For business</Link>
          <Link href="/presentation-maker-for-teachers">For teachers</Link>
          <Link href="/pitch-deck-generator">Pitch decks</Link>
          <Link href="/make/pdf-to-presentation">PDF to presentation</Link>
        </nav>
        <nav className="site-footer__col" aria-label="Account">
          <strong>Account</strong>
          {user ? (
            <>
              <Link href="/decks">My decks</Link>
              <Link href="/account">Account</Link>
            </>
          ) : (
            <>
              <Link href="/signup">Sign up</Link>
              <Link href="/login">Log in</Link>
            </>
          )}
        </nav>
        <nav className="site-footer__col" aria-label="Legal">
          <strong>Company</strong>
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          {SITE.contactEmail && <a href={`mailto:${SITE.contactEmail}`}>Contact</a>}
        </nav>
      </div>
      <p className="site-footer__legal muted small">© {new Date().getFullYear()} {SITE.name}. All rights reserved. Made with <em>amore</em>.</p>
    </footer>
  );
}

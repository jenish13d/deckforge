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
          <Link href="/#templates">Templates</Link>
          <Link href="/#themes">Themes</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/#faq">FAQ</Link>
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
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          {SITE.contactEmail && <a href={`mailto:${SITE.contactEmail}`}>Contact</a>}
        </nav>
      </div>
      <p className="site-footer__legal muted small">© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
    </footer>
  );
}

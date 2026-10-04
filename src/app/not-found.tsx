import { Compass } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="page page--narrow">
        <div className="empty-state">
          <Compass size={44} className="empty-state__icon" aria-hidden="true" />
          <h1 className="page-title">We couldn&apos;t find that page</h1>
          <p className="muted">The link may be wrong, or the deck may have been deleted.</p>
          <div className="row row--center">
            <Link href="/" className="button button--primary">Go to the home page</Link>
            <Link href="/decks" className="button">My decks</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

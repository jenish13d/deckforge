import { SITE } from "@/lib/site";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="page page--narrow prose">
        <h1>{title}</h1>
        <p className="muted">Last updated {updated}</p>
        {children}
        <h2>Contact</h2>
        <p>
          Questions about this page? {SITE.contactEmail ? (
            <>Email us at <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</>
          ) : (
            <>Contact us through the details on our website.</>
          )}
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

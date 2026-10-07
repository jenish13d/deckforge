import Link from "next/link";

import { ReportForm } from "@/components/ReportForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { captchaEnabled } from "@/lib/captcha";

export const metadata = { title: "Report a deck", robots: { index: false } };

export default async function ReportPage(props: PageProps<"/report">) {
  const deck = String((await props.searchParams).deck ?? "").replace(/[^a-z0-9]/gi, "").slice(0, 40);
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader />
      <main id="main" className="page page--narrow">
        <h1 className="page-title">Report a deck</h1>
        {deck ? (
          <>
            <p className="muted">
              Tell us what&apos;s wrong with <Link href={`/d/${deck}`}>this deck</Link>. Reports are read by a person, and decks that break our{" "}
              <Link href="/terms">terms</Link> are taken down.
            </p>
            <ReportForm deckId={deck} loggedIn={Boolean(user)} captcha={captchaEnabled()} />
          </>
        ) : (
          <p className="muted">Open the deck you want to report and use the “Report” link under it.</p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

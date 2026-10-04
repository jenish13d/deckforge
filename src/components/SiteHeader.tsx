import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { PLANS, planOf } from "@/lib/plans";
import { LogoutButton } from "./LogoutButton";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="site-header">
      <Link href="/" className="site-header__brand">Deckforge</Link>
      <nav className="site-header__nav">
        {user ? (
          <>
            <Link href="/decks">My decks</Link>
            <Link href="/account" className="credits-pill" title="Credits left this month">
              {user.credits} credits · {PLANS[planOf(user.plan)].label}
            </Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="button button--primary button--small">Sign up free</Link>
          </>
        )}
      </nav>
    </header>
  );
}

import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/LogoutButton";
import { Logo } from "@/components/Logo";
import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { PLANS, planOf } from "@/lib/plans";
import { AppNav } from "./AppNav";

/** Layout for signed-in pages: sidebar on wide screens, top bar + bottom tabs on phones. */
export async function AppShell({ children, next = "/" }: { children: React.ReactNode; next?: string }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const plan = planOf(user.plan);
  const monthly = PLANS[plan].monthlyCredits;
  const admin = isAdminEmail(user.email);
  const name = user.email.split("@")[0];
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="app">
      <aside className="app-side no-print">
        <Link href="/" className="app-side__brand"><Logo /></Link>
        <Link href="/account" className="workspace" title={user.email}>
          <span className="avatar" aria-hidden="true">{initial}</span>
          <span className="workspace__text">
            <strong>{name}</strong>
            <span>{PLANS[plan].label} plan</span>
          </span>
        </Link>
        <Link href="/" className="button button--soft app-side__create">
          <Plus size={18} aria-hidden="true" /> Create new
        </Link>
        <AppNav admin={admin} variant="side" />
        <div className="app-side__spacer" />
        <div className="credit-box">
          <div className="row row--between">
            <span className="small strong">Credits</span>
            <span className="small muted">{user.credits.toLocaleString()} / {monthly.toLocaleString()}</span>
          </div>
          <div className="credit-meter__bar" role="presentation">
            <span style={{ width: `${Math.min(100, (user.credits / monthly) * 100)}%` }} />
          </div>
          {plan === "free" && (
            <Link href="/account#upgrade" className="credit-box__upgrade">
              <Sparkles size={15} aria-hidden="true" /> Upgrade to Pro
            </Link>
          )}
        </div>
        <div className="app-side__foot">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="app-main">
        <header className="app-top no-print">
          <Link href="/" className="app-top__brand"><Logo /></Link>
          <Link href="/account" className="credits-pill" title="Credits left this month">{user.credits} credits</Link>
          <Link href="/account" className="avatar" aria-label="Account">{initial}</Link>
        </header>
        <main id="main" className="app-content">{children}</main>
      </div>

      <AppNav admin={admin} variant="tabs" />
    </div>
  );
}

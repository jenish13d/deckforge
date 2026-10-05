import Link from "next/link";

import { MODES, MODE_IDS, PLANS } from "@/lib/plans";
import { premiumAvailable } from "@/lib/providers";

const features = (): { label: string; free: string | boolean; pro: string | boolean }[] => [
  { label: "Credits every month", free: String(PLANS.free.monthlyCredits), pro: PLANS.pro.monthlyCredits.toLocaleString() },
  { label: "About how many cards (Standard)", free: `~${PLANS.free.monthlyCredits / MODES.standard.creditsPerCard}`, pro: `~${PLANS.pro.monthlyCredits / MODES.standard.creditsPerCard}` },
  { label: "Quick and Standard modes", free: true, pro: true },
  { label: premiumAvailable() ? "Premium mode" : "Premium mode (coming soon)", free: false, pro: true },
  { label: "All themes, editing, present mode", free: true, pro: true },
  { label: "Share links and PDF download", free: true, pro: true },
  { label: "Free AI outlines", free: true, pro: true },
];

const cell = (value: string | boolean) =>
  value === true ? (
    <>
      <span aria-hidden="true">✓</span>
      <span className="sr-only">Included</span>
    </>
  ) : value === false ? (
    <>
      <span className="muted" aria-hidden="true">–</span>
      <span className="sr-only">Not included</span>
    </>
  ) : (
    value
  );

export function Pricing({ ctaHref = "/signup", compact = false }: { ctaHref?: string; /** Hide the comparison table (landing page). */ compact?: boolean }) {
  return (
    <div className="pricing-block">
      <div className="pricing-cards">
        <div className="price-card">
          <h3>{PLANS.free.label}</h3>
          <p className="price-card__price">$0</p>
          <p className="muted">For trying it out and occasional decks.</p>
          <Link href={ctaHref} className="button">Start free</Link>
        </div>
        <div className="price-card price-card--featured">
          <span className="badge">Most popular</span>
          <h3>{PLANS.pro.label}</h3>
          <p className="price-card__price">
            $12<span className="muted small"> / month</span>
          </p>
          <p className="muted">For people who present every week.</p>
          <Link href={ctaHref} className="button button--primary">Get Pro</Link>
        </div>
      </div>

      {compact ? (
        <p className="center">
          <Link href="/pricing">Compare plans in detail</Link>
        </p>
      ) : (
        <table className="compare">
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">Feature</span></th>
              <th scope="col">Free</th>
              <th scope="col">Pro</th>
            </tr>
          </thead>
          <tbody>
            {features().map((f) => (
              <tr key={f.label}>
                <th scope="row">{f.label}</th>
                <td>{cell(f.free)}</td>
                <td>{cell(f.pro)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="muted small center">
        Credits per card:{" "}
        {MODE_IDS.map((id, i) => (
          <span key={id}>
            {i > 0 && " · "}
            {MODES[id].label} {MODES[id].creditsPerCard}
          </span>
        ))}
        . Unused credits refill monthly. Cancel any time.
      </p>
    </div>
  );
}

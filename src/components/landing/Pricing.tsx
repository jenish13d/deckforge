import Link from "next/link";

import { billingConfigured } from "@/lib/billing";
import { MODES, MODE_IDS, PLANS } from "@/lib/plans";
import { premiumAvailable } from "@/lib/providers";

type Row = { label: string; free: string | boolean; pro: string | boolean; max: string | boolean };

const cards = (plan: keyof typeof PLANS) => `~${(PLANS[plan].monthlyCredits / MODES.standard.creditsPerCard).toLocaleString("en-US")}`;

const features = (): Row[] => [
  { label: "Credits every month", free: "60", pro: "1,000", max: "4,000" },
  { label: "About how many cards (Standard)", free: cards("free"), pro: cards("pro"), max: cards("max") },
  { label: "Quick and Standard modes", free: true, pro: true, max: true },
  { label: premiumAvailable() ? "Premium mode" : "Premium mode (coming soon)", free: false, pro: true, max: true },
  { label: "Detail level", free: "Medium", pro: "Low, Medium, High", max: "Low, Medium, High" },
  { label: "Research with sources, facts checked", free: true, pro: true, max: true },
  { label: "All themes, editing, AI rewrites, present mode", free: true, pro: true, max: true },
  { label: "Build from your files (PDF, Word, PowerPoint, images)", free: true, pro: true, max: true },
  { label: "Share links and PDF download", free: true, pro: true, max: true },
  { label: "PowerPoint (.pptx) download", free: false, pro: true, max: true },
  { label: "“Made with Slidezza” badge", free: "Always on", pro: "Optional", max: "Optional" },
  { label: "Unused credits", free: "Refill monthly", pro: "Refill monthly", max: "Roll over, up to 2× monthly" },
  { label: "Priority generation (more slides written at once)", free: false, pro: false, max: true },
  { label: "Brand kit (your logo and colours)", free: false, pro: false, max: "Coming soon" },
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
  // Until payments open, the paid buttons lead to the list for an email when they do.
  const open = billingConfigured();
  const paidHref = (plan: "pro" | "max") => (open ? ctaHref : `/pro?plan=${plan}`);
  return (
    <div className="pricing-block">
      <div className="pricing-cards pricing-cards--three">
        <div className="price-card">
          <h3>{PLANS.free.label}</h3>
          <p className="price-card__price">$0</p>
          <p className="muted">For trying it out and occasional decks.</p>
          <Link href={ctaHref} className="button">Start free</Link>
        </div>
        <div className="price-card price-card--featured">
          <span className="badge">Recommended</span>
          <h3>{PLANS.pro.label}</h3>
          <p className="price-card__price">
            $12<span className="muted small"> / month</span>
          </p>
          <p className="muted">For people who present every week. PowerPoint, no badge, more detail.</p>
          <Link href={paidHref("pro")} className="button button--primary">Get Pro</Link>
        </div>
        <div className="price-card">
          <h3>{PLANS.max.label}</h3>
          <p className="price-card__price">
            $29<span className="muted small"> / month</span>
          </p>
          <p className="muted">For teams and heavy users. 4× the credits, rollover and priority.</p>
          <Link href={paidHref("max")} className="button">Get Max</Link>
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
              <th scope="col">Max</th>
            </tr>
          </thead>
          <tbody>
            {features().map((f) => (
              <tr key={f.label}>
                <th scope="row">{f.label}</th>
                <td>{cell(f.free)}</td>
                <td>{cell(f.pro)}</td>
                <td>{cell(f.max)}</td>
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
        . Failed cards are refunded. Cancel any time.
      </p>
    </div>
  );
}

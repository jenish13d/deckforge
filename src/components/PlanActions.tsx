"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/client";
import type { PlanId } from "@/lib/plans";

export function PlanActions({
  plan,
  billing,
  maxBilling = false,
  demo,
  hasCustomer,
  onWaitlist = false,
}: {
  plan: PlanId;
  billing: boolean;
  /** Max can be bought (its Stripe price is set up). */
  maxBilling?: boolean;
  demo: boolean;
  hasCustomer: boolean;
  /** Already asked for Pro while payments weren't set up. */
  onWaitlist?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function go(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const redirectTo = (path: string, body: Record<string, unknown> = {}) =>
    go(async () => {
      const { url } = await api<{ url: string }>(path, { method: "POST", body });
      window.location.href = url;
    });

  const demoSwitch = (target: PlanId) =>
    go(async () => {
      await api("/api/billing/demo", { body: { plan: target } });
      router.refresh();
    });

  return (
    <div className="stack" id="upgrade">
      {plan === "free" && billing && (
        <div className="row">
          <button type="button" className="button button--primary" disabled={busy} onClick={() => redirectTo("/api/billing/checkout", { plan: "pro" })}>
            Upgrade to Pro
          </button>
          {maxBilling && (
            <button type="button" className="button" disabled={busy} onClick={() => redirectTo("/api/billing/checkout", { plan: "max" })}>
              Get Max
            </button>
          )}
        </div>
      )}
      {plan !== "free" && billing && hasCustomer && (
        <button type="button" className="button" disabled={busy} onClick={() => redirectTo("/api/billing/portal")}>
          Manage billing
        </button>
      )}
      {demo && (
        <>
          <div className="row">
            {(["free", "pro", "max"] as const)
              .filter((p) => p !== plan)
              .map((p) => (
                <button key={p} type="button" className={p === "free" ? "button" : "button button--primary"} disabled={busy} onClick={() => demoSwitch(p)}>
                  Switch to {p === "free" ? "Free" : p === "pro" ? "Pro" : "Max"} (demo)
                </button>
              ))}
          </div>
          <p className="muted small">Demo billing is on: plans switch without payment. Turn it off before launch.</p>
        </>
      )}
      {plan === "free" && !billing && !demo && (
        <>
          {onWaitlist && (
            <p className="success" role="status">
              Perfetto! You&apos;re on the list. We&apos;ll email you the moment paid plans open.
            </p>
          )}
          <div className="row">
            <Link href="/pro?plan=pro" className="button button--primary">
              {onWaitlist ? "Change plan" : "Get Pro"}
            </Link>
            {!onWaitlist && (
              <Link href="/pro?plan=max" className="button">
                Get Max
              </Link>
            )}
          </div>
          {!onWaitlist && <p className="muted small">Pro and Max open soon. Leave your email and we&apos;ll tell you first.</p>}
        </>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

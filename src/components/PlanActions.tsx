"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/client";

export function PlanActions({
  plan,
  billing,
  demo,
  hasCustomer,
  onWaitlist = false,
}: {
  plan: "free" | "pro";
  billing: boolean;
  demo: boolean;
  hasCustomer: boolean;
  /** Already asked for Pro while payments weren't set up. */
  onWaitlist?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(onWaitlist);
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

  const redirectTo = (path: string) =>
    go(async () => {
      const { url } = await api<{ url: string }>(path, { method: "POST", body: {} });
      window.location.href = url;
    });

  const demoSwitch = (target: "free" | "pro") =>
    go(async () => {
      await api("/api/billing/demo", { body: { plan: target } });
      router.refresh();
    });

  const joinWaitlist = () =>
    go(async () => {
      await api("/api/billing/waitlist", { body: {} });
      setJoined(true);
    });

  return (
    <div className="stack" id="upgrade">
      {plan === "free" && billing && (
        <button type="button" className="button button--primary" disabled={busy} onClick={() => redirectTo("/api/billing/checkout")}>
          Upgrade to Pro
        </button>
      )}
      {plan === "pro" && billing && hasCustomer && (
        <button type="button" className="button" disabled={busy} onClick={() => redirectTo("/api/billing/portal")}>
          Manage billing
        </button>
      )}
      {demo && (
        <>
          <button type="button" className="button button--primary" disabled={busy} onClick={() => demoSwitch(plan === "free" ? "pro" : "free")}>
            {plan === "free" ? "Upgrade to Pro (demo, no payment)" : "Switch back to Free (demo)"}
          </button>
          <p className="muted small">Demo billing is on: plans switch without payment. Turn it off before launch.</p>
        </>
      )}
      {plan === "free" && !billing && !demo && (joined ? (
        <p className="success" role="status">
          🎉 You&apos;re on the Pro list! Pro opens very soon and we&apos;ll email you first.
        </p>
      ) : (
        <>
          <button type="button" className="button button--primary" disabled={busy} onClick={joinWaitlist}>
            Upgrade to Pro
          </button>
          <p className="muted small">Pro is opening soon. Click to get on the list and we&apos;ll email you the moment it&apos;s ready.</p>
        </>
      ))}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

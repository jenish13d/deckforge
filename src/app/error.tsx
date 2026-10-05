"use client"; // Error boundaries must be Client Components

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="page page--narrow">
      <div className="empty-state">
        <TriangleAlert size={44} className="empty-state__icon" aria-hidden="true" />
        <h1 className="page-title">Something went wrong</h1>
        <p className="muted">Sorry about that. Please try again; if it keeps happening, use the Feedback button to tell us.</p>
        <div className="row row--center">
          <button type="button" className="button button--primary" onClick={() => retry()}>Try again</button>
          <Link href="/" className="button">Go to the home page</Link>
        </div>
      </div>
    </main>
  );
}

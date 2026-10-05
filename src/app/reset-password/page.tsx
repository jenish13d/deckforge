import Link from "next/link";

import { ResetForm } from "@/components/ResetForm";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = { title: "Reset password", robots: { index: false } };

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const token = (await props.searchParams).token;
  return (
    <>
      <SiteHeader />
      <main id="main" className="page page--auth">
        {typeof token === "string" && token ? (
          <ResetForm token={token} />
        ) : (
          <div className="panel auth-form">
            <h1 className="auth-form__title">Link not valid</h1>
            <p className="muted">This reset link is incomplete. Open the link from your email again, or ask for a new one.</p>
            <Link href="/forgot-password">Get a new link</Link>
          </div>
        )}
      </main>
    </>
  );
}

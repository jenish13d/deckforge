import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { captchaEnabled } from "@/lib/captcha";
import { safeNext } from "@/lib/site";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { title: "Log in", robots: PRIVATE_ROBOTS };

export default async function Page(props: PageProps<"/login">) {
  const next = safeNext((await props.searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <>
      <SiteHeader />
      <main id="main" className="page page--auth">
        <AuthForm mode="login" next={next} captcha={captchaEnabled()} />
      </main>
    </>
  );
}

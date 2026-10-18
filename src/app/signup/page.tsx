import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { captchaEnabled } from "@/lib/captcha";
import { normalizeCode } from "@/lib/prelaunch";
import { lockedHere } from "@/lib/prelaunch-server";
import { safeNext } from "@/lib/site";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { title: "Sign up", robots: PRIVATE_ROBOTS };

export default async function Page(props: PageProps<"/signup">) {
  const params = await props.searchParams;
  const next = safeNext(params.next);
  if (await getCurrentUser()) redirect(next);
  return (
    <>
      <SiteHeader />
      <main id="main" className="page page--auth">
        <AuthForm mode="signup" next={next} captcha={captchaEnabled()} invite={(await lockedHere()) ? { code: normalizeCode(params.code) } : null} />
      </main>
    </>
  );
}

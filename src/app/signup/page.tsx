import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { captchaEnabled } from "@/lib/captcha";
import { safeNext } from "@/lib/site";

export const metadata = { title: "Sign up" };

export default async function Page(props: PageProps<"/signup">) {
  const next = safeNext((await props.searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <>
      <SiteHeader />
      <main className="page page--auth">
        <AuthForm mode="signup" next={next} captcha={captchaEnabled()} />
      </main>
    </>
  );
}

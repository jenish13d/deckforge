import { ForgotForm } from "@/components/ForgotForm";
import { SiteHeader } from "@/components/SiteHeader";
import { captchaEnabled } from "@/lib/captcha";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { title: "Forgot password", robots: PRIVATE_ROBOTS };

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="page page--auth">
        <ForgotForm captcha={captchaEnabled()} />
      </main>
    </>
  );
}

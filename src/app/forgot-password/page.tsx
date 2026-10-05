import { ForgotForm } from "@/components/ForgotForm";
import { SiteHeader } from "@/components/SiteHeader";
import { captchaEnabled } from "@/lib/captcha";

export const metadata = { title: "Forgot password" };

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

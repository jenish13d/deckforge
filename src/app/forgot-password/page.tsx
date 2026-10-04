import { ForgotForm } from "@/components/ForgotForm";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="page page--auth">
        <ForgotForm />
      </main>
    </>
  );
}

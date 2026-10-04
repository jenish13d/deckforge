import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Sign up · Deckforge" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <>
      <SiteHeader />
      <main className="page page--auth">
        <AuthForm mode="signup" />
      </main>
    </>
  );
}

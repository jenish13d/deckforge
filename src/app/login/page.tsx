import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Log in · Deckforge" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <>
      <SiteHeader />
      <main className="page page--auth">
        <AuthForm mode="login" />
      </main>
    </>
  );
}

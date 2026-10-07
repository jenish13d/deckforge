import { AppShell } from "@/components/app/AppShell";
import { TemplateGallery } from "@/components/landing/TemplateGallery";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Presentation templates",
  description: "Start a presentation from a template: startup pitch, sales proposal, monthly report, lesson, team onboarding or talk. AI fills it in for your topic.",
  alternates: { canonical: "/templates" },
};

const startWith = (id: string) => `/?template=${id}`;
const signupFor = (id: string) => `/signup?next=${encodeURIComponent(startWith(id))}`;

export default async function TemplatesPage() {
  const user = await getCurrentUser();
  const content = (
    <div className="page">
      <h1 className="page-title">Templates</h1>
      <p className="muted">Pick a starting point. You&apos;ll fill in your details before anything is written.</p>
      <TemplateGallery hrefFor={user ? startWith : signupFor} />
    </div>
  );
  if (user) return <AppShell next="/templates">{content}</AppShell>;
  return (
    <>
      <SiteHeader />
      <main id="main">{content}</main>
      <SiteFooter />
    </>
  );
}

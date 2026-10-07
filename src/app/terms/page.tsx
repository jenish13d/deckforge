import { LegalPage } from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="October 7, 2026">
      <p>By creating an account or using {SITE.name}, you agree to these terms.</p>

      <h2>Your account</h2>
      <p>Keep your login details safe; you are responsible for activity on your account. You must be old enough to agree to these terms where you live.</p>

      <h2>Your content</h2>
      <p>You own the prompts you enter and the decks you create. You give us permission to store and process them only to provide the service to you. Don&apos;t submit content you don&apos;t have the right to use.</p>

      <h2>Shared decks</h2>
      <p>A deck you share with a link can be viewed by anyone who has the link. Turn sharing off at any time from the Share window.</p>

      <h2>Photos and other people&apos;s work</h2>
      <p>Photos are found automatically from free-licence libraries (such as Wikimedia Commons and Openverse) and credited to their authors, as their licences require. Keep those credits when you reuse a deck, and check a photo&apos;s licence before using it on its own.</p>

      <h2>Reporting content and copyright</h2>
      <p>If a deck uses your copyrighted work without permission, or breaks these terms, use the “Report” link under the deck{SITE.contactEmail ? <> or write to <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a></> : null}. Tell us which deck and slide, what the original work is, and how to reach you. We review every report and remove content that infringes rights or breaks these terms, and may close accounts of repeat infringers.</p>

      <h2>AI-generated content</h2>
      <p>Decks are written with the help of AI and may contain mistakes. Review facts, figures and quotes before you rely on or publish them.</p>

      <h2>Acceptable use</h2>
      <p>Don&apos;t use {SITE.name} to create illegal, harmful, hateful or misleading content, to infringe others&apos; rights, or to disrupt or overload the service.</p>

      <h2>Plans, credits and payments</h2>
      <ul>
        <li>Generating cards uses credits. Each plan includes a monthly allowance; unused credits do not roll over.</li>
        <li>Paid plans renew automatically each period until you cancel. You can cancel at any time from your Account page; your plan stays active until the end of the paid period.</li>
        <li>Prices may change; we will tell you before a change affects your subscription.</li>
        <li>Except where the law requires otherwise, payments are non-refundable.</li>
      </ul>

      <h2>Ending your use</h2>
      <p>You can stop using {SITE.name} at any time. We may suspend accounts that break these terms.</p>

      <h2>Disclaimer and liability</h2>
      <p>{SITE.name} is provided “as is”. To the extent the law allows, we are not liable for indirect or consequential losses, and our total liability is limited to the amount you paid us in the 12 months before the claim. Nothing in these terms limits rights you have under consumer law.</p>

      <h2>Changes</h2>
      <p>We may update these terms. If changes are significant, we will let you know before they take effect.</p>
    </LegalPage>
  );
}

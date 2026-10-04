import { LegalPage } from "@/components/LegalPage";
import { textProvider } from "@/lib/providers";
import { SITE } from "@/lib/site";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  const usesGemini = textProvider() === "gemini";
  return (
    <LegalPage title="Privacy policy" updated="October 4, 2026">
      <p>This policy explains what {SITE.name} collects, why, and the choices you have.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your email address and a securely hashed version of your password. We never store your password itself.</li>
        <li><strong>Your content:</strong> the prompts, outlines and decks you create.</li>
        <li><strong>Billing details:</strong> if you upgrade, payments are handled by our payment provider. We receive your plan status, not your full card number.</li>
        <li><strong>Technical data:</strong> basic request information such as IP address, used to keep the service secure and prevent abuse.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account and generate, store and display your decks.</li>
        <li>To manage your plan, credits and payments.</li>
        <li>To protect the service against fraud and abuse.</li>
      </ul>
      <p>We do not sell your personal information, and we do not use your decks for advertising.</p>

      <h2>Who we share it with</h2>
      <ul>
        <li>
          <strong>AI providers:</strong> your prompts and outlines are sent to our AI providers (Anthropic and Google) to
          generate deck content.
          {usesGemini && (
            <> We currently use Google&apos;s Gemini API free tier, under which Google may use submitted content to improve
            its products. Please don&apos;t enter sensitive or confidential information.</>
          )}
        </li>
        <li><strong>Payment provider:</strong> to process subscriptions.</li>
        <li><strong>Hosting and database providers:</strong> to run the service.</li>
      </ul>
      <p>These providers process data on our behalf and only for these purposes.</p>

      <h2>Cookies</h2>
      <p>We use one essential cookie to keep you signed in. We don&apos;t use advertising or tracking cookies.</p>

      <h2>Shared decks</h2>
      <p>Anyone with a deck&apos;s view link can see that deck. Only share links with people you trust.</p>

      <h2>Keeping and deleting data</h2>
      <p>We keep your account and decks while your account is open. You can delete decks at any time, and you can ask us to delete your account and its data.</p>

      <h2>Your rights</h2>
      <p>Depending on where you live (for example under the GDPR, UK GDPR or California law), you may have the right to access, correct, export or delete your personal data, and to object to some processing. Contact us to make a request.</p>

      <h2>Children</h2>
      <p>{SITE.name} is not intended for children under 13, or under 16 where local law requires.</p>

      <h2>Changes</h2>
      <p>If we make important changes to this policy, we will update this page and the date above.</p>
    </LegalPage>
  );
}

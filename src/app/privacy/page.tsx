import { headers } from "next/headers";

import { AnalyticsChoice } from "@/components/Analytics";
import { LegalPage } from "@/components/LegalPage";
import { consentFrom } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { SITE } from "@/lib/site";

export const metadata = { title: "Privacy policy" };

export default async function PrivacyPage() {
  const user = await getCurrentUser();
  const consent = consentFrom(await headers());
  return (
    <LegalPage title="Privacy policy" updated="October 18, 2026">
      <p>This policy explains what {SITE.name} collects, why, and the choices you have.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your email address and a securely hashed version of your password. We never store your password itself.</li>
        <li><strong>Your content:</strong> the prompts, outlines and decks you create.</li>
        <li><strong>Billing details:</strong> if you upgrade, payments are handled by our payment provider. We receive your plan status, not your full card number.</li>
        <li><strong>Pro and Max list:</strong> if you ask to hear when paid plans open, we keep your email and chosen plan, send a confirmation and one email when they open, and nothing else. Every email has a link to leave the list, which deletes your entry.</li>
        <li><strong>Technical data:</strong> basic request information such as IP address, used to keep the service secure and prevent abuse.</li>
        <li><strong>Launch list:</strong> before we open, if you leave your email on the home page we keep it, send a confirmation and one email when we open, and nothing else. Every email has a link to leave the list, which deletes your entry.</li>
        <li><strong>Usage analytics, if you allow it:</strong> see &ldquo;Analytics&rdquo; below.</li>
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
          <strong>AI providers:</strong> your prompts, outlines and the text of files you attach are sent to the AI services
          that write and check your decks: Anthropic (Claude), OpenAI, Google (Gemini), Groq, OpenRouter and Z.ai (GLM), depending on which are available
          at the time. Some of them offer free tiers under which they may use submitted content to improve their models,
          so please don&apos;t enter sensitive or confidential information. If you are in the EU, EEA, UK or Switzerland,
          your content is not sent to Google&apos;s free tier or to Z.ai.
        </li>
        <li>
          <strong>Files you attach:</strong> documents (PDF, Word, PowerPoint, Excel, text) are read in your browser; only
          their text is sent to us, and it is stored with the deck so its slides can be checked against it. Photos and
          scanned pages are sent as images to an AI provider to read their text; we don&apos;t store the images.
        </li>
        <li>
          <strong>Research:</strong> for factual topics, search terms based on your topic are sent to Wikipedia and to our
          web search provider (Tavily) to find sources. The sources are listed with your deck.
        </li>
        <li><strong>Payment provider:</strong> to process subscriptions.</li>
        <li><strong>Analytics provider:</strong> PostHog, if analytics is on (see below).</li>
        <li><strong>Hosting and database providers:</strong> to run the service.</li>
      </ul>
      <p>These providers process data on our behalf and only for these purposes.</p>

      <h2>Cookies</h2>
      <p>
        We use one essential cookie to keep you signed in, and one to remember your analytics choice. If you allow
        analytics, PostHog also stores an anonymous id in your browser. We don&apos;t use advertising cookies.
      </p>

      <h2 id="analytics">Analytics</h2>
      <p>
        To see how {SITE.name} is used and to fix what goes wrong, we use PostHog (product analytics, error reports and
        session replays). It records the pages you visit, steps such as signing up or finishing a deck, errors, and how
        you move around the page. Replays never show what you type into forms, the text of your decks, or any text in the
        signed-in app; your account is identified by an id, not your email. Data is processed in the
        United States and replays are kept for 30 days.
      </p>
      <p>
        Visitors from the EU, EEA, UK and Switzerland are asked first, and nothing is collected until they allow it.
        Everyone can change their choice here at any time:
      </p>
      <AnalyticsChoice initial={consent} userId={user?.id ?? null} enabled={Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)} />
      <p>
        Server errors are reported without any personal details. Turning analytics off stops everything else.
      </p>

      <h2>Shared decks</h2>
      <p>New decks can be viewed by anyone with their link, so only share links with people you trust. You can make any deck private from its Share window; then only you can open it.</p>

      <h2>Keeping and deleting data</h2>
      <p>Accounts made with an invite code before launch are deleted, with their decks, 24 hours after sign-up. We keep other accounts and decks while the account is open. You can delete decks at any time. On the Account page you can download all your data, or delete your account, which removes it and all its decks for good.</p>

      <h2>Your rights</h2>
      <p>Depending on where you live (for example under the GDPR, UK GDPR or California law), you may have the right to access, correct, export or delete your personal data, and to object to some processing. You can export or delete your data yourself from the Account page, or contact us to make a request.</p>

      <h2>Children</h2>
      <p>{SITE.name} is not intended for children under 13, or under 16 where local law requires.</p>

      <h2>Changes</h2>
      <p>If we make important changes to this policy, we will update this page and the date above.</p>
    </LegalPage>
  );
}

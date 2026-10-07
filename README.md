# Slidezza

(Code repository: `deckforge`, the project's original name.)

An AI presentation builder in the spirit of Gamma. Describe what you want to present; Slidezza
plans an outline you can edit, then writes a themed deck card by card. Edit any card, regenerate it
with instructions, reorder, switch themes in one click, present full-screen, share a link or download a PDF.

## Features

- **Prompt → outline → deck.** The outline step lets the user fix the structure before anything is written.
- **Build from files:** attach up to 5 files (PDF, scanned PDF, Word .docx, PowerPoint .pptx, Excel .xlsx, CSV,
  text/Markdown, photos). Documents are read in the browser (`src/lib/read-file.ts`; pdf.js's worker is copied
  to `public/` on install); photos and scanned pages go to `/api/extract`, where a vision model reads them.
  The text becomes "file" sources (`src/lib/material.ts`): the outline is planned across the whole material,
  and figures from the user's own files are used as given by the fact check.
- **Marketing hub (`/admin`, owner only):** a to-do list built from the numbers, sign-ups and decks per day, leads
  on the Pro/Max list, newest sign-ups and feedback (counts only: nobody's deck titles or prompts). It can be
  installed as an app (Edge or Chrome → Apps → Install this site as an app), and a summary email arrives each
  morning when `CRON_SECRET` is set (Vercel cron in `vercel.json`, once a day on the free plan).
- **Pro and Max list:** until payments are set up, "Get Pro" / "Get Max" lead to `/pro`, where anyone leaves an
  email (`ProWaitlist`). They get a confirmation (when SMTP is set), every email has a leave link, and the
  admin page has a button to email everyone once paid plans open.
- **Detail levels:** Low / Medium / High (Low and High on paid plans) set how much each card says and how wide
  the research goes.
- **Search pages:** `/make/...` guides for common searches (PDF to presentation, pitch decks, school, lessons,
  reports), listed in the sitemap, footer and `llms.txt`, with FAQ and breadcrumb structured data.
- **Cards appear one by one** (3 at a time); one failure doesn't sink the deck, and reloading resumes unfinished cards.
- **8 card layouts** (title, section, bullets, columns, big numbers, quote, timeline, table), picked per card by
  the AI; the first card is always a cover, and neighbouring cards are kept from repeating a layout.
- **Editing:** edit form per card, regenerate with instructions, add, delete, reorder.
- **9 themes**, including Italian-inspired Amalfi and Toscana and **Milano** (the default): bold navy, mustard and
  cream slides with text on panels and a classic display serif, rotating backgrounds from slide to slide.
- **Slide design:** labels above titles, big highlight numbers, tables, timelines across the slide, two-column
  lists, photos alternating left and right, and covers with the photo filling the slide behind a text panel.
  Text shrinks automatically when it wouldn't fit (on screen, in PDFs and in PowerPoint). On phones, slides
  in the editor and viewer reflow like a document.
- **Present mode** and **share links** (view-only).
- **Downloads:** **PDF** (built in the browser: each card rendered at 1280×720 into a 16:9 page, identical in
  every browser) and **PowerPoint (.pptx)** with native, editable text, shapes and photos in the deck's theme.
- **Photos:** the AI suggests photo keywords per card and Title, Section, Bullets and Quote cards get a photo
  beside the text, credited on the slide (creator and license). Default source is **Openverse** (no key; only
  Flickr/Wikimedia photos under CC BY, CC0 or public domain, so commercial use is allowed without
  share-alike); set `PEXELS_API_KEY` to use Pexels instead, or `PHOTOS=off` to disable. Users can search, swap
  or remove photos in the card editor. Photos and picker previews are served through `/api/image` (allowed
  hosts only) so exports can read them and viewers' browsers don't contact photo sites directly.
- **Accounts:** email + password, "My decks", only the owner can edit. **Forgot password** sends a one-time
  link valid for 1 hour (SMTP, e.g. Gmail with an app password; the same answer is shown whether or not the
  email has an account). **Change password** on the Account page. Both sign out other devices.
- **My decks:** search, sort, and a menu on every deck (open, share, rename, duplicate, delete); "Select" to
  delete several decks at once. The editor's "⋯" menu can duplicate or delete the deck.
- **Sharing:** a Share window with copy link, WhatsApp, Telegram, X, LinkedIn, Facebook, Reddit, email and the
  phone's own share sheet. Owners can switch a deck between "anyone with the link" and private (`Deck.shared`);
  private decks show a "This deck is private" page to everyone else, and their link preview hides the title.
  Shared links get a preview image (`opengraph-image`) in chat apps and social networks.
- **Account controls:** "Remember me" on log in (off = the session ends when the browser closes, at most a day),
  show/hide password, download all my data (JSON) and delete my account (password required).
- **Site basics:** custom 404 and error pages, robots.txt, sitemap.xml, web app manifest and home-screen icon.
  The site always uses its light design, whatever the device's dark-mode setting.
- **Search engines and AI assistants:** schema.org data on the home page (product, prices, FAQ), `/llms.txt`
  (a plain-text summary for AI tools), sitemap, robots.txt open to AI crawlers, and optional Google/Bing
  ownership codes (`GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`).
- **Bot protection:** an "I'm not a robot" checkbox ([ALTCHA](https://altcha.org), self-hosted proof-of-work,
  no third-party service or key) on sign-up, forgot password and feedback from visitors. It takes about
  1–3 seconds in the background; each answer works once and expires after 10 minutes. `CAPTCHA=off` disables it.
- **Feedback:** a "💬 Feedback" button on every page (mood + message, optional email for visitors). Feedback is
  saved, emailed to `NEXT_PUBLIC_CONTACT_EMAIL` when email is set up, and listed on **/admin** with site stats
  (users, decks, cards, Pro users). Admins are `NEXT_PUBLIC_CONTACT_EMAIL` plus `ADMIN_EMAILS`.
- **AI team** (`src/lib/router.ts`): Gemini, Groq, OpenRouter's free models, Z.ai GLM Flash, and (paid)
  Claude and OpenAI, each used for the job it does best (research planning, outline, writing, fact checking),
  with automatic fallback when one is busy. Visitors from the EEA, UK and Switzerland (Vercel's
  `x-vercel-ip-country`) never go to Gemini's free tier (Google's terms) or to China-hosted models.
- **Research and fact checking** (`src/lib/research.ts`, `src/lib/factcheck.ts`): for factual topics the
  outline step plans searches, reads the Wikipedia articles (tables included) and, with `TAVILY_API_KEY`,
  independent web pages, and saves them (`Research`). Cards are written only from these sources. Then every
  number on a card must appear in two independent sources (all of Wikipedia counts as one) next to words
  that say what it counts, quotes must appear word for word, and a second AI lists unsupported claims. A
  failing card is rewritten once; whatever still can't be confirmed is removed. Non-factual decks (a pitch,
  a speech) may only use numbers the user gave, with [placeholders] otherwise. Sources are listed under the deck.
- **Photos of the right subject:** decks with sources take photos from their Wikipedia articles, matched to
  each card by caption ("Ronaldo playing for Juventus in 2019"), free Commons files only. A photo whose shape
  doesn't suit its frame is shown whole over a blurred copy instead of being cropped (on screen, PDF, PowerPoint).
- **Quality modes and credits:**

  | Mode | With Claude (`ANTHROPIC_API_KEY`) | With Gemini only (`GEMINI_API_KEY`) | Credits per card |
  | --- | --- | --- | --- |
  | ⚡ Quick | `claude-haiku-4-5` | `gemini-flash-lite-latest` | 1 |
  | ✨ Standard (default) | `claude-sonnet-5-5` | `gemini-flash-lite-latest` with thinking | 2 |
  | 💎 Premium (Pro only) | `claude-opus-5-5` (or OpenAI with `OPENAI_API_KEY`) | not available ("coming soon") | 4 |

  Gemini's free tier lets the site run at no cost; its daily request limits are shared by all users
  and change over time (check them in Google AI Studio). On Gemini the editor writes one card at a time;
  when Google says it's busy, the card shows "Waiting for the AI…" and retries after the delay Google
  suggests (credits for failed attempts are refunded). If the daily quota runs out, the editor says so.
  Set `GEMINI_STANDARD_MODEL=gemini-flash-latest` for stronger writing on a paid Gemini plan.

  Outlines are free (Standard model, low effort). Failed cards are refunded.
  Credit charges are atomic, so parallel requests can't overspend.
- **Plans:** Free (60 credits/month, Quick + Standard) and Pro ($12/month, 1,000 credits, all modes).
  Credits refill every 30 days and don't roll over. Edit plans and prices in `src/lib/plans.ts`.
- **Payments:** Stripe Checkout subscriptions, customer portal, and webhooks for upgrades, renewals and cancellations.
  Until Stripe is configured, **Upgrade to Pro** puts the user on a **Pro waitlist** instead (no payment): they see
  "You're on the Pro list", the owner gets an email, and **/admin** lists everyone who asked, to email when Pro opens.
  Running out of credits points users to the upgrade button (editor banner, create page and Account page).
- **Demo modes for testing at $0:** `DEMO_AI=1` replaces the AI with sample content; `BILLING_DEMO=1`
  adds a no-payment Free/Pro switch on the Account page (ignored when Stripe is configured; never enable in production).

- **Setup choices:** after the topic, three quick, topic-specific choices (who it's for, what to focus on,
  how long) shape the outline and every card (`/api/setup`).
- **Live planning and writing:** the planning screen shows what the AI is doing; slides shimmer while
  written and land softly when ready.
- **Ask Slidezza:** an assistant in the editor turns requests ("add a slide comparing him with Messi",
  "make slide 3 shorter", "try a darker theme") into changes the user applies with one click.
- **Deck settings:** "Made with Slidezza" badge (always on for Free, removable on Pro), an optional closing
  slide, and photo credits on each photo or on a credits slide at the end; applied on screen, in the
  slideshow, PDF and PowerPoint.
- **Headline highlights:** card titles can mark key words with `*asterisks*`; they show in the theme's accent.
- **Safety:** security headers and a Content Security Policy (`next.config.ts`), a "Report" link and form
  for shared decks, and quotes only when the sources show the person saying them.

## How it works

| Piece | Where |
| --- | --- |
| Pages | `src/app/page.tsx` (landing / create screen), `d/[id]/edit` (editor), `d/[id]` (shared view), `decks`, `templates`, `account`, `admin`, `login`, `signup` |
| Layout | `src/components/app/AppShell.tsx` (signed-in pages: sidebar on laptops, top bar + bottom tabs on phones), `src/components/art/HeroArt.tsx` (SVG illustration), icons from `lucide-react` |
| Brand | `src/lib/site.ts`: name, tagline and description in one place |
| API | `src/app/api/{auth,outline,decks,billing,feedback,captcha,image,images}` |
| AI | `src/lib/ai.ts` (Claude + routing), `src/lib/gemini.ts` (Gemini), `src/lib/providers.ts` (which provider), `src/lib/demo-ai.ts` (sample content) |
| Accounts | `src/lib/auth.ts` (session cookies), `src/lib/password.ts` (scrypt) |
| Credits & plans | `src/lib/credits.ts`, `src/lib/plans.ts` |
| Payments | `src/lib/billing.ts` |
| Data | Prisma + PostgreSQL (`prisma/schema.prisma`): `User`, `Session`, `Deck`, `Card`, `PasswordReset`, `Feedback` |

## Run it

Requires Node 20.9+ and a PostgreSQL database (a free [Neon](https://neon.tech) project works).

```bash
npm install
cp .env.example .env        # put your database strings in .env; demo modes are on by default
npx prisma migrate deploy   # creates the tables
npm run dev                 # http://localhost:3000
```

To put it online, follow **[DEPLOY.md](DEPLOY.md)** (Neon + Vercel, step by step).

For real AI, put an [Anthropic API key](https://console.anthropic.com) in `.env` and set `DEMO_AI=""`.

### Setting up payments (Stripe)

1. Create Products "Pro" and "Max" with monthly recurring Prices in the Stripe dashboard; put their ids in
   `STRIPE_PRICE_PRO` and `STRIPE_PRICE_MAX` (Max checkout stays hidden until its price is set).
2. Add a webhook endpoint `https://<your-domain>/api/billing/webhook` for `checkout.session.completed`,
   `invoice.paid`, `customer.subscription.updated` and `customer.subscription.deleted`; put its signing secret in `STRIPE_WEBHOOK_SECRET`.
3. Put your secret key in `STRIPE_SECRET_KEY` and remove `BILLING_DEMO`.
4. Turn on the customer portal in Stripe settings so users can cancel or change cards.

Sales tax/VAT: with Stripe you are the seller, so enable Stripe Tax or use a merchant of record
(Paddle, Lemon Squeezy) if you'd rather not handle tax registration yourself. Billing code is isolated in
`src/lib/billing.ts` so the provider can be swapped.

Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Before launch checklist

- Set `NEXT_PUBLIC_CONTACT_EMAIL` (shown in the footer and legal pages).
- Have the Privacy policy (`src/app/privacy`) and Terms (`src/app/terms`) reviewed for your country and business.
- Turn off `DEMO_AI` and `BILLING_DEMO`.
- **Hosting plan:** Vercel's free Hobby plan is for non-commercial use only. Move to Vercel Pro (or a host
  whose free tier allows commercial use) before taking the first payment.
- **Copyright safe harbor (US):** register a DMCA designated agent with the US Copyright Office and name it in
  the Terms; reports arrive through the "Report" link under shared decks (`/report`) and show in `/admin`.
- **EU/UK:** name the business and a contact address in the Privacy policy; check whether you need an EU/UK
  representative (GDPR Art. 27) while the company is based outside the EU/UK.
- **GitHub (free):** turn on Dependabot alerts, secret scanning and private vulnerability reporting in the
  repository's Settings → Code security; CI, CodeQL, Dependabot updates, a gitleaks secret scan and a weekly Lighthouse check of the live site are in `.github/`.
- Set `NEXT_PUBLIC_SITE_DOMAIN` once a custom domain is live (shown on the "Made with" closing slide).

## Next steps

1. Move rate limits to Redis/Upstash (they are per server instance today).
2. **Password reset and email verification** (needs an email provider such as Resend).
3. **Images** on cards (stock photos or image generation).
4. **PPTX export**, custom brand themes, import from document/PDF/URL.

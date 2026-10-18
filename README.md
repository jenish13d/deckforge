# Slidezza

(Code repository: `deckforge`, the project's original name.)

An AI presentation builder in the spirit of Gamma. Describe what you want to present; Slidezza
plans an outline you can edit, then writes a themed deck card by card. Edit any card, regenerate it
with instructions, reorder, switch themes in one click, present full-screen, share a link or download a PDF.

## Features

- **Prompt → outline → deck.** The outline step lets the user fix the structure before anything is written.
- **Charts:** when the research gives 3-8 comparable figures in one unit, a slide can show them as a bar chart
  (comparing groups) or a line chart (change over time), drawn in the theme's colours (`src/components/ChartView.tsx`)
  and exported to PowerPoint as a real, editable chart. Every value is fact-checked like any other number; with fewer
  than three confirmed points the slide shows big numbers instead.
- **Web research:** Perplexity's Search API when `PERPLEXITY_API_KEY` is set (paid), Tavily otherwise or as its
  fallback (`TAVILY_API_KEY`, free tier), plus Wikipedia.
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
  ownership codes (`GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`). After a deploy, `npm run indexnow` sends every sitemap page
  to Bing and the other IndexNow engines (the public key is the 32-character `.txt` file in `public/`).
- **Bot protection:** an "I'm not a robot" checkbox ([ALTCHA](https://altcha.org), self-hosted proof-of-work,
  no third-party service or key) on sign-up, forgot password and feedback from visitors. It takes about
  1–3 seconds in the background; each answer works once and expires after 10 minutes. `CAPTCHA=off` disables it.
- **Feedback:** a "💬 Feedback" button on every page (mood + message, optional email for visitors). Feedback is
  saved, emailed to `NEXT_PUBLIC_CONTACT_EMAIL` when email is set up, and listed on **/admin** with site stats
  (users, decks, cards, Pro users). Admins are `NEXT_PUBLIC_CONTACT_EMAIL` plus `ADMIN_EMAILS` (or `ADMIN_EMAIL`).
- **AI team** (`src/lib/router.ts`): Gemini, Groq, OpenRouter's free models, Z.ai GLM Flash, and (paid)
  Claude and OpenAI, each used for the job it does best (research planning, outline, writing, fact checking),
  with automatic fallback when one is busy. Visitors from the EEA, UK and Switzerland (Vercel's
  `x-vercel-ip-country`) never go to Gemini's free tier (Google's terms) or to China-hosted models.
- **Research and fact checking** (`src/lib/research.ts`, `src/lib/factcheck.ts`): for factual topics the
  outline step plans searches, reads the Wikipedia articles (tables included) and, with `TAVILY_API_KEY`,
  independent web pages, and saves them (`Research`). Cards are written only from these sources. Then every
  number on a card must appear in the sources next to words that say what it counts: in two independent
  sources when two or more were found (all of Wikipedia counts as one), in the single source otherwise, quotes must appear word for word, and a second AI lists unsupported claims. A
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
- **Presentation style and the deck plan:** the setup step asks "What style?": **Auto** (the default), **Visual**
  (one idea a slide, short text, shown with photos, figures, timelines and tables) or **Detailed** (explanations,
  examples, tables, and sources named for important claims). It is separate from Quick/Standard (which model
  writes) and from the Low/Medium/High detail level (the baseline amount of text; on Medium, the plan decides per
  card). The style is stored on the deck (`Deck.style`, default `auto`, so older decks and requests without a
  style are Auto). The outline call, with no extra AI call, plans the whole deck: each card gets a purpose, a key
  message, supporting points, a layout, a content depth, a visual direction, whether it states checkable facts, and
  how it follows the previous card (stored with the card's `brief`). `src/lib/plan.ts` then makes the layouts valid
  and balanced across the whole deck in code, and every card is written with that plan, the audience and the style.
  A card that comes back weak (`src/lib/quality.ts`: empty, generic filler, off its plan, repeating another card)
  is sent back for the one rewrite it already had; plain conceptual cards without numbers are not flagged. Fact
  checking also rejects credits to studies or organisations, and web addresses, that are not in the sources.

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
| Credits & plans | `src/lib/credits.ts` (charge and refund through the ledger), `src/lib/plans.ts` |
| Background generation | `src/lib/jobs.ts` (jobs), `src/lib/worker.ts` (worker loop), `src/lib/job-dispatch.ts` (how workers start), `src/lib/job-state.ts` (what the editor shows) |
| Payments | `src/lib/billing.ts` |
| Data | Prisma + PostgreSQL (`prisma/schema.prisma`): `User`, `Session`, `Deck`, `Card`, `PasswordReset`, `Feedback`, `GenerationJob`, `CreditLedger` |

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

### Background generation

Cards are written by the server, not by the browser. You can start a deck, close the tab or refresh, and it
carries on; opening the editor again shows where every card stands.

- **A job per card** (`GenerationJob`). Asking for a card (the deck's first write, or "Rewrite") creates a job.
  The credits are taken in the same database transaction that creates the job, and recorded in `CreditLedger`
  as a `charge`. A failed job's credits are returned once (`refund`); the ledger allows one charge and one
  refund per job, so retries, refreshes and several tabs never charge twice or refund twice.
- **No duplicates.** A card has at most one waiting or running job (a unique index in the migration backs this
  up), and the editor sends one `key` per click, so a repeated request finds the job it already made.
- **Statuses.** `queued` → `running` (with a stage: researching, writing, checking, photos) → `succeeded`;
  a failed attempt goes back to `queued` and retries up to 3 times (the editor shows "Retrying…"); after the
  last attempt the job is `failed` and refunded. Deleting a card or deck cancels its jobs and refunds them.
  A worker that dies is recovered: its job's lease (90 s) runs out and the job is retried or failed.
- **Parallel limit.** The server runs at most `parallelCards(plan)` jobs per user at once (the same limit the
  editor used to follow); the rest wait their turn. Provider fallback, the UK/EU routing rule (the visitor's
  country is saved on the job), fact checking and photo choice are unchanged.
- **Following along.** `POST /api/decks/[id]/generate` queues every card still waiting (the editor calls it when it
  opens; it is safe to call again). `GET /api/decks/[id]/jobs` returns each card's latest job and the credits;
  the editor polls it while any job is active, and re-reads a card when its job finishes.

**Who runs the jobs.** The jobs live in the database, so how a worker is started is a small adapter
(`src/lib/job-dispatch.ts`), chosen with `JOB_DISPATCHER`:

| Value | What happens |
| --- | --- |
| `after` (default) | A worker runs right after the request that created the job (Next's `after()`), for up to `JOB_WORKER_SECONDS` (35). If jobs are left it calls `/api/jobs/process` to start a fresh worker with its own time limit. Needs `JOBS_SECRET` (or `CRON_SECRET`) for that hand-over. |
| `webhook` | Sends `{ "userId" }` to `JOB_DISPATCH_URL` (an external queue such as Vercel Queues, QStash or Inngest). That service must call `POST /api/jobs/process` with `Authorization: Bearer <JOBS_SECRET>`, which runs the worker. Falls back to `after` if the queue can't be reached. |
| `none` | Starts nothing (tests, or your own process calling `/api/jobs/process`). |

Whatever the setting, leftovers are also picked up by the editor's poll and by the cron in `vercel.json`
(`/api/jobs/process`, once a day, because the free Vercel plan allows nothing more often; on Pro change its
schedule to `* * * * *` so jobs finish even when nobody has the editor open and the hand-over is unavailable).

Environment variables (all optional):

| Variable | Purpose |
| --- | --- |
| `JOB_DISPATCHER` | `after` (default), `webhook` or `none`, as above. |
| `JOBS_SECRET` | Password for `/api/jobs/process`. Falls back to `CRON_SECRET`; with neither set the endpoint answers 404 and the hand-over is off. |
| `JOB_DISPATCH_URL` | Queue ingest URL for `webhook`. |
| `JOB_WORKER_SECONDS` | How long a worker keeps starting new jobs (default 35; routes stop at 60 s). |

**Locally.** Nothing extra is needed: `npm run dev` uses `after`, so the worker runs inside the dev server, and the
editor's poll nudges it if it stops. To follow the hand-over locally set `APP_URL=http://localhost:3000` and
`JOBS_SECRET=anything`. Run `npx prisma migrate deploy` first: the new tables and the one-job-per-card index come
with migration `20261008120000_generation_jobs`.

### Developer tools

All five tools you asked for are connected, each in the safest form that still works:

| Tool | How it is connected | Read this first |
| --- | --- | --- |
| **Claude Code Setup** (official) | On for this project in `.claude/settings.json`. Ask Claude Code "recommend automations for this project". | Read-only: it only recommends. |
| **Claude-Mem** (`thedotmack/claude-mem`) | On for this project in `.claude/settings.json`, pinned to release `v13.34.2`, with `CLAUDE_MEM_ONLINE_OPTIN=false` so it stays on your computer. | It records what each session does (prompts and tool results, so anything pasted into chat or printed by a command) in a local database and feeds summaries into later sessions. Never paste keys or passwords into chat. Wrap anything sensitive in `<private>…</private>`. Old summaries come back as context, so treat them like any other untrusted text. It downloads Bun and uv if missing. To turn it off, delete its two lines in `.claude/settings.json`. |
| **Strix** (`usestrix/strix`) | Manual GitHub workflow `.github/workflows/strix.yml` (Actions → "Strix security scan" → Run workflow). | Needs the `LLM_API_KEY` secret and `STRIX_LLM` variable. Scans this repository's code in a sandbox, never the live site; sends code to your AI provider and costs tokens. Install script hash-checked, version pinned. |
| **Agent Reach** (`Panniantong/Agent-Reach`) | `scripts/setup-agent-reach.sh` installs reviewed commit `f65526c` (v1.5.0) into its own virtual environment and only runs its status check. Rules for using it are in `AGENTS.md`. | Public pages only. Its login channels (X, Reddit, Instagram, Facebook, LinkedIn, Xiaohongshu…) need your cookies and risk account bans, so we don't set them up. |
| **FreeLLMAPI** (`tashfeenahmed/freellmapi`) | An optional last-choice AI provider in `src/lib/router.ts`, **development only**. Run FreeLLMAPI yourself, then set `FREELLMAPI_BASE_URL` (e.g. `http://localhost:3001/v1`) and `FREELLMAPI_KEY`. | Its README says "personal experimentation and learning, not production". It is off on Vercel unless `FREELLMAPI_ALLOW_PRODUCTION=1` (then the privacy policy must name it), never used for UK/EU/Swiss visitors, Premium or photo reading, and plain `http` is allowed only to this computer. |

### Before launch (invite-only)

Set `PRELAUNCH=1` in Vercel and redeploy to lock the site until launch:

- The home page says "opening soon" and collects emails (the launch list). Other public pages send visitors
  to the home page; shared deck links, sign-in, Privacy and Terms still work. The sitemap lists only the home page.
- Only admins (`ADMIN_EMAILS` and `NEXT_PUBLIC_CONTACT_EMAIL`) and people with an invite code can sign up or
  sign in. Other accounts are treated as signed out.
- In `/admin` → "Before launch": make an invite code (works once, within 24 hours; send the link
  `/signup?code=XXXX-XXXX`). The account it makes lasts 24 hours, then it is deleted with its decks (when
  they next visit, and by the daily cron).
- "Start fresh" deletes every account except the admins' (type `DELETE ALL`). Waitlists and feedback stay.
- Admins write Quick and Standard cards (the free AI models) without spending credits; Premium still costs credits.

To launch: remove `PRELAUNCH`, redeploy, then use "Tell the list we're open" in `/admin`.

To open the site in most of the world first, use `PRELAUNCH_COUNTRIES=IN` (comma-separated ISO codes) instead of
`PRELAUNCH=1`: visitors whose IP is in those countries (Vercel's `x-vercel-ip-country`) get the locked site; everyone
else, and search engines, get the open one. Country by IP is approximate (a VPN changes it). "Start fresh" only works
under the full lock, so it can't delete real users from the open countries.
Code: `src/lib/prelaunch.ts`, `src/lib/invites.ts`, `src/lib/launch-list.ts`, `src/proxy.ts`.

### Analytics (PostHog)

Optional, off until `NEXT_PUBLIC_POSTHOG_KEY` is set (PostHog → Settings → Project → Project API key; public by
design). It records page views, the sign-up funnel, errors and session replays. Visitors from the EU, EEA, UK,
Switzerland or an unknown country see a cookie question first and nothing loads until they allow it; everyone can
change it on `/privacy#analytics`. Replays mask every form field, slide text and all text in the signed-in app.
Events go through `/ingest` on this site (rewrites in `next.config.ts`), so the security policy stays `'self'`.

| Event | Where | When |
| --- | --- | --- |
| `$pageview` | browser | every page, including in-app navigation |
| `signup_started` | browser | first focus on the sign-up form |
| `signup_error` | browser | sign-up refused (`status`: 400 invalid/captcha, 409 email taken, 429 too many) |
| `signed_up` | server | account created |
| `deck_created` | server | outline sent for writing (`cards`, `style`, `mode`, `depth`, `sources`) |
| `deck_completed` | browser | every card of a new deck written |
| `card_failed` | browser | a card couldn't be written (`code`) |
| `$exception` | both | browser errors, server request errors (`src/instrumentation.ts`), unexpected card-job errors |

Sign-up funnel in PostHog: `$pageview` → `signup_started` → `signed_up` → `deck_created` → `deck_completed`.
Code: `src/lib/analytics.ts` (server), `src/lib/analytics-client.ts` (browser), `src/lib/consent.ts`, `src/components/Analytics.tsx`.

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

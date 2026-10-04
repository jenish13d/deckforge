# Deckforge

An AI presentation builder in the spirit of Gamma. Describe what you want to present; Deckforge
plans an outline you can edit, then writes a themed deck card by card. Edit any card, regenerate it
with instructions, reorder, switch themes in one click, present full-screen, share a link or download a PDF.

## Features

- **Prompt → outline → deck.** The outline step lets the user fix the structure before anything is written.
- **Cards appear one by one** (3 at a time); one failure doesn't sink the deck, and reloading resumes unfinished cards.
- **7 card layouts** (title, section, bullets, columns, big numbers, quote, timeline), picked per card by the AI.
- **Editing:** edit form per card, regenerate with instructions, add, delete, reorder.
- **6 themes**, **present mode** and **share links** (view-only).
- **Downloads:** **PDF** (built in the browser: each card rendered at 1280×720 into a 16:9 page, identical in
  every browser) and **PowerPoint (.pptx)** with native, editable text, shapes and photos in the deck's theme.
- **Photos:** with `PEXELS_API_KEY` set, the AI suggests photo keywords per card and Title, Section, Bullets
  and Quote cards get a Pexels photo beside the text, credited on the slide. Users can search, swap or remove
  photos in the card editor. Photos are served through `/api/image` (Pexels only) so exports can read them.
- **Accounts:** email + password, "My decks", only the owner can edit. **Forgot password** sends a one-time
  link valid for 1 hour (SMTP, e.g. Gmail with an app password; the same answer is shown whether or not the
  email has an account). **Change password** on the Account page. Both sign out other devices.
- **Quality modes and credits:**

  | Mode | With Claude (`ANTHROPIC_API_KEY`) | With Gemini only (`GEMINI_API_KEY`) | Credits per card |
  | --- | --- | --- | --- |
  | ⚡ Quick | `claude-haiku-4-5` | `gemini-flash-lite-latest` | 1 |
  | ✨ Standard (default) | `claude-sonnet-5-5` | `gemini-flash-lite-latest` with thinking | 2 |
  | 💎 Premium (Pro only) | `claude-opus-5-5` | not available ("coming soon") | 4 |

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
- **Demo modes for testing at $0:** `DEMO_AI=1` replaces the AI with sample content; `BILLING_DEMO=1`
  adds a no-payment Free/Pro switch on the Account page (ignored when Stripe is configured; never enable in production).

## How it works

| Piece | Where |
| --- | --- |
| Pages | `src/app/page.tsx` (home/create), `d/[id]/edit` (editor), `d/[id]` (shared view), `decks`, `account`, `login`, `signup` |
| API | `src/app/api/{auth,outline,decks,billing}` |
| AI | `src/lib/ai.ts` (Claude + routing), `src/lib/gemini.ts` (Gemini), `src/lib/providers.ts` (which provider), `src/lib/demo-ai.ts` (sample content) |
| Accounts | `src/lib/auth.ts` (session cookies), `src/lib/password.ts` (scrypt) |
| Credits & plans | `src/lib/credits.ts`, `src/lib/plans.ts` |
| Payments | `src/lib/billing.ts` |
| Data | Prisma + PostgreSQL (`prisma/schema.prisma`): `User`, `Session`, `Deck`, `Card` |

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

1. Create a Product "Pro" with a monthly recurring Price in the Stripe dashboard; put its id in `STRIPE_PRICE_PRO`.
2. Add a webhook endpoint `https://<your-domain>/api/billing/webhook` for `checkout.session.completed`,
   `invoice.paid` and `customer.subscription.deleted`; put its signing secret in `STRIPE_WEBHOOK_SECRET`.
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

## Next steps

1. Move rate limits to Redis/Upstash (they are per server instance today).
2. **Password reset and email verification** (needs an email provider such as Resend).
3. **Images** on cards (stock photos or image generation).
4. **PPTX export**, custom brand themes, import from document/PDF/URL.

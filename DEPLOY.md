# Putting Slidezza online (step by step)

(The code repository and Vercel project are named `deckforge`, the original name.)

You need: a **Neon** account (database) and a **Vercel** account (website). Both are free to start.
Time: about 20 minutes.

> **Important:** Vercel needs access to the GitHub repo. The repo lives on **jenish13d's** GitHub,
> so the easiest path is for **jenish13d** to do Part 2 (sign up to Vercel with that GitHub account).

---

## Part 1 — Create the database (Neon)

1. Go to **https://neon.tech** → **Sign up** (GitHub or Google is fine).
2. Create a project:
   - Project name: `deckforge`
   - Region: **AWS US East (N. Virginia)** (the same area Vercel uses by default)
   - Click **Create project**.
3. On the project dashboard, click **Connect**.
4. You'll see a connection string starting with `postgresql://`. There is a **Connection pooling** switch:
   - With pooling **ON**, copy the string → this is your **DATABASE_URL** (its host contains `-pooler`).
   - With pooling **OFF**, copy the string → this is your **DIRECT_URL**.
5. Keep both somewhere private (e.g. a note on your computer). **They are passwords — never post or share them.**

## Part 2 — Put the website online (Vercel)

1. Go to **https://vercel.com** → **Sign Up** → **Continue with GitHub** (use the GitHub account that owns the repo).
2. Click **Add New… → Project**.
3. Find **deckforge** in the list and click **Import**.
   (If it isn't listed, click **Adjust GitHub App Permissions** and give Vercel access to the `deckforge` repo.)
4. On the configure screen:
   - **Framework Preset:** Next.js (detected automatically)
   - The build command is already set in `vercel.json`, so you don't need to change it.
   - Open **Environment Variables** and add these, one by one (Name → Value → **Add**):

     | Name | Value |
     | --- | --- |
     | `DATABASE_URL` | the pooled string from Neon |
     | `DIRECT_URL` | the direct (non-pooled) string from Neon |
     | `DEMO_AI` | `1` |
     | `BILLING_DEMO` | `1` |
     | `NEXT_PUBLIC_CONTACT_EMAIL` | your contact email |

5. Click **Deploy**. Wait 1–3 minutes.
6. When you see **Congratulations**, click the preview to open your site. Your link looks like
   `https://deckforge-xxxx.vercel.app`. Sign up and make a deck to check everything works.

From now on, **every push to GitHub updates the live site automatically.**

## Part 3 — Your computer uses the online database too

Your local copy now needs the same database settings:

1. In the `deckforge` folder, open `.env` in Notepad.
2. Replace the old `DATABASE_URL="file:./dev.db"` line with:
   ```
   DATABASE_URL="(pooled string from Neon)"
   DIRECT_URL="(direct string from Neon)"
   ```
3. Save, then in the terminal:
   ```
   git pull
   npm install
   npx prisma migrate deploy
   npm run dev
   ```

(Your computer and the live site will share the same data. That's fine for now; later you can make a
separate Neon "branch" for testing.)

## Later steps

- **Photos on slides:** on automatically (Openverse, no key). Optional: a Pexels key in `PEXELS_API_KEY`.
- **Forgot-password emails (free, from your Gmail):**
  1. Turn on 2-Step Verification for your Google account (myaccount.google.com → Security).
  2. Create an app password: myaccount.google.com/apppasswords → name it "Slidezza" → copy the 16 letters.
  3. In Vercel add: `SMTP_HOST` = `smtp.gmail.com`, `SMTP_PORT` = `465`, `SMTP_USER` = your Gmail address,
     `SMTP_PASS` = the 16-letter app password (Secret), `APP_URL` = your site address → Redeploy.

- **Feedback and admin page:** the 💬 Feedback button works with no setup. Log in with the email in
  `NEXT_PUBLIC_CONTACT_EMAIL` and an **Admin** link appears at the top (or open `/admin`). To let another
  account in, add `ADMIN_EMAILS` (comma-separated emails) in Vercel and redeploy.
- **"I'm not a robot" check:** on by default, nothing to set up.

- **Free real AI (Gemini):** get a free key at https://aistudio.google.com → **Get API key**. In Vercel →
  **Settings → Environment Variables**: add `GEMINI_API_KEY` (Secret), **delete** `DEMO_AI` and
  `BILLING_DEMO`, then **Deployments → ⋯ → Redeploy**. Quick and Standard now use real AI; Premium shows
  "coming soon".
- **More free AI (recommended):** add any of `GROQ_API_KEY` (https://console.groq.com), `OPENROUTER_API_KEY`
  (https://openrouter.ai) and `ZAI_API_KEY` (https://z.ai) the same way. They work as a team with Gemini:
  each job goes to the best one, and when one is busy the next takes over. Groq is needed for visitors from
  the UK and EU, because Google's terms only allow its paid Gemini API for them.
- **Research and fact checking:** works with Wikipedia out of the box. Add `TAVILY_API_KEY`
  (https://tavily.com, free 1,000 searches a month) so decks are also checked against independent websites;
  then every number on a slide needs two sources that agree.
- **Claude or OpenAI (paid, adds Premium):** add `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` (with `OPENAI_MODEL`,
  default `gpt-6-astra`) the same way and redeploy. Paid models then lead the team.
- **Before taking real payments:** remove `BILLING_DEMO`, add the Stripe variables (see README).
  Note: Vercel's free **Hobby** plan is for non-commercial use. Upgrade the Vercel project to **Pro**
  (about $20/month) before you start charging customers.
- **Your own domain** (e.g. `slidezza.com`): buy it at any registrar, then Vercel → **Settings → Domains → Add**.

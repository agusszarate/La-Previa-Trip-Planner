# La Previa 🌍

Platform for organizing trips with friends. Shared expenses, flight tracking, accommodations, and more.

## Stack

- **Frontend + API**: Next.js 16 (App Router) on Vercel
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Magic Link
- **Emails**: Gmail SMTP (Nodemailer)
- **Scraping**: Cheerio
- **Cron**: Vercel Cron + GitHub Actions
- **Total cost**: $0

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `scripts/001-schema.sql`
3. In **Authentication > URL Configuration**, add `http://localhost:3000/auth/callback` as a redirect URL
4. Copy the project URL and anon key

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in your credentials:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `GMAIL_USER` — Your Gmail email
- `GMAIL_APP_PASSWORD` — Gmail app password (requires 2FA enabled)
- `CRON_SECRET` — Random string to protect the cron endpoint
- `KIWI_API_KEY` — (Optional) Kiwi Tequila API key for flights

### 3. Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security > 2-Step Verification (enable if not already)
3. App passwords > Generate new
4. Copy the 16-character password

### 4. Run Locally

```bash
npm install
npm run dev
```

### 5. Deploy to Vercel

```bash
npx vercel
```

Configure environment variables in the Vercel dashboard.

### 6. GitHub Actions (Cron)

In your GitHub repo, add these secrets:
- `APP_URL` — Your Vercel app URL (e.g., https://la-previa.vercel.app)
- `CRON_SECRET` — Same string as in `.env.local`

## Features

- **Shared expenses**: Add expenses, split equally, see who owes whom
- **Multi-currency**: ARS, USD, EUR, BRL
- **Members**: Add friends by email or invite link
- **Accommodations**: Paste Airbnb links, auto-scrape price
- **Flights**: Price alerts with daily checking
- **Checklist**: Assignable packing list
- **Combo builder**: Compare and vote on trip options by category

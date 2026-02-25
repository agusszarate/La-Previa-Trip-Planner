# Project Architecture

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Supabase** (PostgreSQL + Auth with Magic Link)
- **Nodemailer** (Gmail SMTP for emails)
- **Cheerio** (accommodation scraping)
- **Vercel** (deploy) + **GitHub Actions** (cron)

## File Structure

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Login (Magic Link)
│   ├── layout.tsx                # Root layout with ThemeProvider
│   ├── dashboard/page.tsx        # User's trip list
│   ├── trips/
│   │   ├── new/page.tsx          # Create new trip
│   │   └── [id]/page.tsx         # Trip detail (server component, data fetching)
│   ├── invite/[code]/            # Invitation flow
│   │   ├── page.tsx              # Server: validates invite and renders client
│   │   └── InviteClient.tsx      # Client: login + join trip
│   ├── auth/callback/route.ts    # Supabase Auth callback
│   ├── profile/page.tsx          # User profile
│   └── api/
│       ├── cron/route.ts         # Cron job: flight checking (Kiwi API)
│       ├── scrape/route.ts       # Airbnb scraping with Cheerio
│       └── trips/invite/route.ts # Invite link generation
│
├── components/
│   ├── TripDetail.tsx            # Trip tab orchestrator (~170 lines)
│   ├── ComboBuilder.tsx          # "Build Combo" tab (options by category)
│   ├── Navbar.tsx                # Navigation bar
│   ├── ThemeProvider.tsx         # Dark/light mode context
│   └── trip/                     # Sub-components for each tab
│       ├── constants.ts          # TABS, CATEGORIES, CURRENCIES, OPTION_CATEGORIES
│       ├── ExpensesTab.tsx       # Shared expenses + debts
│       ├── MembersTab.tsx        # Members + invitations
│       ├── AccommodationsTab.tsx # Accommodations + scraping
│       ├── FlightsTab.tsx        # Flight alerts
│       ├── ChecklistTab.tsx      # Assignable item checklist
│       └── PreviewTab.tsx        # Interactive combo preview
│
├── lib/
│   ├── types.ts                  # TypeScript interfaces and types
│   ├── debts.ts                  # Debt simplification algorithm (min-cash-flow)
│   ├── email.ts                  # Nodemailer config + templates
│   ├── utils.ts                  # nanoid, formatMoney, formatDate, getInitials
│   └── supabase/
│       ├── client.ts             # Supabase client (browser)
│       ├── server.ts             # Supabase client (server components)
│       └── middleware.ts         # Session management
│
├── middleware.ts                 # Next.js middleware (session refresh)
└── proxy.ts                      # Middleware proxy

scripts/
├── 001-schema.sql                # Complete DB schema (for fresh deploys)
├── 002-rename-skipass.sql        # Migration: skipass → tickets
└── 003-rename-spanish-enums.sql  # Migration: Spanish enum values → English

.github/workflows/
└── cron-check-flights.yml        # GitHub Action for daily flight checking
```

## Conventions

### Language

- **Code**: All function names, variable names, enum values, comments, and documentation in **English**
- **UI**: All user-facing strings (labels, placeholders, button text, titles) in **Spanish** (Argentine Spanish)

### Components

- **Server components** in `app/` for data fetching
- **Client components** (`"use client"`) for interactivity
- Each trip tab is an independent component in `components/trip/`
- Shared constants go in `components/trip/constants.ts`

### Database

- 11 tables in Supabase (see `scripts/001-schema.sql`)
- RLS disabled (app is for friends, auth handled by Supabase Auth)
- New migrations go as `scripts/00X-description.sql`

### Authentication

- Magic Link via Supabase Auth (passwordless)
- Middleware refreshes session on every request
- Invitations via link with unique code

### Categories

- **Expenses**: accommodation, transport, food, gear, tickets, activities, other
- **Combo options**: accommodation, transport_outbound, transport_return, tickets, gear, food, activities, other
- **Currencies**: ARS, USD, EUR, BRL

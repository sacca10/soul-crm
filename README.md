# Dashboard Syndicate

A full-stack CRM and operations dashboard built to replace an agency's Airtable-based workflow with a real product: role-based views, lead pipeline management, sales/commission reporting, and automated data capture from marketing and scheduling tools.

Built solo, end to end — schema design, auth, business logic, UI, and third-party integrations.

**Stack:** Next.js 14 (App Router) · TypeScript · Supabase (Postgres, Auth, RLS) · Tailwind CSS · Vercel

<!--
Screenshots — add images under `public/screenshots/` and reference them here, e.g.:
![Overview dashboard](public/screenshots/overview.png)
![Leads kanban](public/screenshots/kanban.png)
-->

## Why this exists

The agency was running its entire sales operation — leads, calls, commissions, collections — out of Airtable automations. That worked until it didn't: no real auth/permissions model, no proper relational integrity, and every new report meant another fragile formula field. This project replaces that with a purpose-built app with actual role-based access, a normalized Postgres schema, and automations that run server-side instead of inside spreadsheet formulas.

## Features

**Role-based sections**, each scoped to what that role actually needs:

- **Management** — company-wide KPIs, 12-month revenue trend, sales funnel, team commission breakdown (setter × closer pivot), fixed expenses tracking, content performance ranking.
- **Setters** — lead inbox with per-status counters, searchable lead table, lead detail view, a drag-and-drop Kanban across the full pipeline, a visual SVG funnel covering 12 pipeline stages + 3 post-booking stages, and a lead triage flow.
- **Closers** — personal dashboard with upcoming calls, a call-report form with dynamic program/payment-method selects, a reports grid, and a full calendar (month/week/day) view of scheduled calls.
- **Marketing** — CTA management tied into inbound lead attribution.
- **Collections** — installment tracking with payment status.
- **Settings** — CRUD for team members (with roles), payment methods, sales programs, and manual daily KPI entry with history.

**Automation & integrations**

- Lead capture via **ManyChat** webhook (Instagram DM automations → lead created automatically).
- Call bookings synced via **Calendly** webhook (`invitee.created` / `invitee.canceled`).
- Hourly FX rate job (Vercel Cron) for crypto-dollar pricing, with DB-level caching.
- Signed webhook verification (shared-secret headers, HMAC) on all inbound endpoints.

**Data layer**

- 12-table normalized Postgres schema with enums, triggers, and Row Level Security — only authenticated users can read/write their own org's data.
- A single data-access layer (`src/lib/data/*`) that transparently switches between an in-memory mock store (for local dev/demos, no DB required) and live Supabase queries, controlled by one env flag.
- Per-request KPI caching via React `cache()` — a dashboard page pulling six KPIs fires one query, not six.

## Getting started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

By default `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`, which skips auth and serves deterministic mock data — the whole app is explorable at `http://localhost:3000` with zero external setup.

To run it against a real backend:

1. Create a [Supabase](https://supabase.com) project.
2. Run `supabase/migrations/0001_initial_schema.sql` in the SQL editor.
3. Create a private `comprobantes` storage bucket (receipts/attachments) with authenticated read/write policies.
4. Copy your project URL and keys into `.env.local`, set `NEXT_PUBLIC_DEV_BYPASS_AUTH=false`.
5. Deploy to Vercel — the FX-rate cron and both webhook endpoints work out of the box once env vars are set there too.

### Scripts

```bash
npm run dev          # Dev server
npm run build         # Production build
npm run start         # Serve production build
npm run lint           # ESLint
npm run typecheck     # tsc --noEmit
```

## Architecture

```
src/
  app/
    (auth)/login/              Login
    (app)/                     Authenticated shell + sidebar
      direccion/                Management: overview, commissions, performance, expenses, content
      setter/                   Leads: panel, table, kanban, funnel, triage, new-lead form
      closer/                   Calls: panel, call report, grid, calendar, agenda detail
      marketing/                 CTAs
      cobros/                   Collections: list + detail
      ajustes/                   Settings: KPIs, team, wallets, programs, FX
    api/webhooks/               ManyChat + Calendly ingestion
    api/cron/                   Scheduled FX-rate refresh
    api/health/                 Health check
  components/
    ui/                        Base primitives (shadcn-style)
    layout/                    Sidebar, user menu
    dashboard/                 KPI cards
    charts/                    Area/bar charts, compact + full SVG funnel
    kanban/                     dnd-kit Kanban board
    closer/                     FullCalendar wrapper
  lib/
    data/                      Data-access layer (mock store ⇄ Supabase, same API)
    supabase/                  Browser/server/middleware/service clients
    domain.ts                  Shared types, enums, labels
    fx.ts                      FX rate fetching/caching
supabase/migrations/            Full SQL schema (run once per environment)
```

## Environment variables

See `.env.local.example` for the full template.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (browser) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Private key, server only |
| `MANYCHAT_WEBHOOK_SECRET` | Shared secret validated on the ManyChat webhook |
| `CALENDLY_WEBHOOK_SECRET` | HMAC signing key for Calendly webhook verification |
| `CALENDLY_API_KEY` | Used to register webhook subscriptions via the Calendly API |
| `CRON_SECRET` | Bearer token required by the Vercel Cron job |
| `NEXT_PUBLIC_APP_URL` | Public URL of the deployment |
| `NEXT_PUBLIC_DEV_BYPASS_AUTH` | `true` to skip auth locally with mock data; `false` in production |

## License

Private project, shared here for portfolio purposes.

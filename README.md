# Dawati (دعواتي)

Bilingual (Arabic RTL + English) WhatsApp-native event invitation platform for Saudi Arabia (Riyadh, Jeddah).

> Status: **Milestone 2 of 6: auth and DB.** Done: design system + landing page, Supabase schema/RLS/seed, email + phone OTP login, roles. Next: create-event flow, dashboard, check-in, admin. The complete README (messaging contract, deploy) lands with the final milestone.

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · next-intl · Supabase (Postgres + Auth + RLS)

## Getting started
```bash
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000 → /ar
```
The landing page works without a backend. Sign-in and everything behind it needs Supabase:

```bash
npm run db:start            # needs Docker; prints API URL and keys
# copy API URL, anon key and service_role key into .env.local
npm run db:reset            # applies supabase/migrations and supabase/seed.sql
```
`NEXT_PUBLIC_*` values are inlined at build time, so set them before `npm run build`.

### Demo accounts (local only)
| Role | Phone | Email |
|---|---|---|
| Admin | 0500000001 | admin@dawati.test |
| Host | 0500000002 | host@dawati.test |
| Planner (org "Noura Events") | 0500000003 | planner@dawati.test |
| Staff (door) | 0500000004 | staff@dawati.test |

Phone OTP is always `123456` locally (`supabase/config.toml` → `[auth.sms.test_otp]`). Email codes arrive in Inbucket at http://127.0.0.1:54324.
In production, configure an SMS provider in Supabase Auth (or route OTP via WhatsApp once the messaging provider is live).

## Database
- `supabase/migrations/`: schema and RLS. Row-level security is the tenant boundary: hosts see their events, planners their organisation's, door staff only events they are assigned to, admins everything. Roles cannot be self-escalated (`protect_profile_role`); sign-up only ever creates `host` or `planner`.
- Door check-in is one atomic SQL function, `check_in_guest(event, guest)`.
- `npm run db:types` regenerates TypeScript types after schema changes.
- `tests/db.test.ts` applies the real migrations and seed to an in-process Postgres (PGlite) and verifies RLS, role protection, check-in and erasure, so no Docker is needed for `npm test`.

## Scripts
`npm run lint` · `npm run typecheck` · `npm test` · `npm run build`

## Conventions
- **All copy lives in `messages/ar.json` and `messages/en.json`.** A test enforces identical keys, and `en.json` types `useTranslations`. Client components only receive the namespaces listed in `CLIENT_NAMESPACES` (`app/[locale]/layout.tsx`): add a namespace there when a client component needs it.
- **RTL:** use logical Tailwind utilities (`ms-`, `pe-`, `start-`, `end-`), never `left`/`right`.
- **Pricing:** edit `lib/pricing/config.ts` only; the UI and server both read from it.
- **Design tokens:** `app/globals.css` (`@theme`). Gold text uses `gold-ink` for WCAG AA contrast.
- **Auth guards:** middleware only checks that a session exists; role checks happen in server components via `requireArea()` (`lib/auth/session.ts`), and RLS enforces the data rules regardless.

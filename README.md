# Dawati (دعواتي)

Bilingual (Arabic RTL + English) WhatsApp-native event invitation platform for Saudi Arabia (Riyadh, Jeddah).
Hosts and planners pick a designed invitation, upload a guest list, and guests confirm in WhatsApp and receive a QR ticket that staff scan at the door.

> **This build is a clickable mockup.** Everything runs on browser-side demo data (saved in `localStorage`), so it works with no backend and can be deployed anywhere in a minute. The Supabase schema, auth and the messaging interface are already in place for the real build (see [What is real vs mocked](#what-is-real-vs-mocked)).

## Run it
```bash
npm install
npm run dev            # http://localhost:3000  → redirects to /ar
```
No environment variables are needed for the demo. `npm run build && npm start` for production.

### Deploy to Vercel (2 minutes)
1. Push this repo to GitHub (already done for this branch).
2. vercel.com → **Add New → Project** → import the repo → select branch `claude/invitation-platform` (or merge it to `main` first).
3. Framework preset: Next.js (auto). No env vars required. Deploy, then share the URL.

The production site URL for canonical links can be set with `NEXT_PUBLIC_SITE_URL`.

## Five-minute tour for a first-time viewer
1. **Landing** (`/ar`, switch to English with the button top-right): hero, how it works, features, templates, planners, live pricing calculator, FAQ.
2. **Templates** (`/ar/templates`): filter by occasion/style/format, open a card for a live preview with your names, date and venue; animated/video cards have motion and music.
3. **Sign in** (`/ar/login`): tap **Host** (or use any Saudi mobile + code `123456`).
4. **Create an event** (`/ar/events/new`): details → template → customize (try the "Adapt to my theme" box, e.g. "navy and gold, Najdi style") → upload a guest list (CSV/Excel; invalid +966 numbers are flagged) → WhatsApp preview → pricing → demo checkout.
5. **Dashboard**: watch invitations go sent → delivered → confirmed/declined live; open the event for the guest table, resend, CSV export, reminder schedule, privacy tools.
6. **Guest view**: on the event page open "guest's WhatsApp view" (`/ar/i/<token>`), tap *Yes, I'll attend* → the personal QR ticket appears.
7. **Check-in** (switch role to **Staff**, `/ar/checkin`): open an event; use the camera, or the **Demo: test codes** panel to scan a valid, an already-used and an invalid code, with the live attended/confirmed counter.
8. **Admin** (switch role to **Admin**): customers, events, revenue, message volume, template management. **Planner** role: clients and team.

Use the account menu (top-right avatar) to switch role or reset the demo data.

### Demo accounts
| Role | Mobile | Email |
|---|---|---|
| Admin | 0500000001 | admin@dawati.test |
| Host | 0500000002 | host@dawati.test |
| Planner (Noura Events) | 0500000003 | planner@dawati.test |
| Staff (door) | 0500000004 | staff@dawati.test |

OTP code is always `123456` in demo mode.

## What is real vs mocked
| Area | Status |
|---|---|
| UI, i18n (ar/en, RTL), design system, responsive layouts | Real |
| Pricing (`lib/pricing/config.ts`: 150 / 200 base, 2 SAR per guest, 15% VAT, 10-guest minimum) | Real, configurable constants |
| Guest import (CSV/Excel), Saudi +966 validation, duplicates | Real |
| QR tickets: HMAC-signed tokens, atomic check-in logic, camera scanning (BarcodeDetector + jsQR) | Real logic; demo secret in `lib/qr/token.ts` |
| Data store | **Mock**: browser `localStorage` (`lib/demo/*`), deterministic seed |
| WhatsApp sending | **Mock provider** behind `lib/messaging/` (contract below) |
| Payments | **Mock** checkout (no card data collected) |
| AI theme adaptation | Route `app/api/ai/adapt-template` calls Anthropic when `FEATURE_AI_THEME=true` + `ANTHROPIC_API_KEY`; otherwise a deterministic stub |
| Auth | Demo OTP now. Real email/phone OTP via Supabase is built (`NEXT_PUBLIC_DATA_MODE=supabase`) but the app pages are not yet wired to it |
| Database | Supabase schema + RLS + seed are ready in `supabase/` and tested; not yet used by the app pages |
| Cron reminders (7 d / 1 d) | Schedule logic and UI built; the cron route is part of the real build |

## For the WhatsApp integration partner
Everything WhatsApp goes through one interface: **`lib/messaging/types.ts`**. Implement `WhatsAppProvider` in `lib/messaging/whatsapp.ts` and set `MESSAGING_PROVIDER=whatsapp`. The contract (methods, payloads, webhook events, idempotency, opt-out, template names/variables) is documented in **[`lib/messaging/README.md`](lib/messaging/README.md)**. The reference behaviour for webhook events is `applyInboundEvent` in `lib/demo/actions.ts`; message copy and template names are in `lib/messaging/templates.ts`.

## Project layout
```
app/[locale]/            pages (marketing, (site) public, (auth) login, (app) signed-in, i/[token] guest ticket)
app/api/ai/              Anthropic theme-adaptation route (feature-flagged)
components/              ui/ marketing/ invitation/ wizard/ dashboard/ checkin/ ticket/ admin/ clients/ templates/ qr/
lib/messaging/           provider interface, mock, WhatsApp stub, message templates  ← partner plugs in here
lib/demo/                demo data model, seed, pure actions, store, send/webhook services
lib/pricing, phone, guests, qr, ai, auth, admin, door, templates
messages/{ar,en}/*.json  all copy, split per feature (merged in messages/index.ts)
supabase/                migrations, RLS, seed, config (real backend, ready for the next phase)
tests/                   Vitest (pure logic + SQL/RLS via in-process Postgres)
```

## Conventions
- **No hardcoded copy.** All strings live in `messages/<locale>/*.json`; a test enforces identical ar/en keys and `en` types `useTranslations`. Client components receive only the namespaces listed in `CLIENT_NAMESPACES` (`app/[locale]/layout.tsx`).
- **RTL:** logical Tailwind utilities (`ms-`, `pe-`, `start-`…); phone numbers and codes in `<bdi dir="ltr">`.
- **Dates:** Gregorian via `Intl` with `Asia/Riyadh`; Arabic uses Latin digits for consistency with phone numbers and prices.
- **PDPL:** hosts attest permission to contact guests (recorded), every message offers opt-out (STOP), per-guest and per-event export and erasure, 90-day retention policy; privacy policy and terms at `/privacy` and `/terms` are **drafts for review by Saudi counsel**.

## Scripts
`npm run lint` · `npm run typecheck` · `npm test` · `npm run build` · `npm run db:start|db:reset|db:types` (Supabase, needs Docker)

## Quality snapshot
Lint, typecheck, build and 114 unit/RLS tests pass. Lighthouse (mobile, simulated throttling, local production build, landing): accessibility 100, best practices 100, SEO 91 (canonical link only resolves on the real domain), performance 82 (ar) / 88 (en); the perf gap to 90 is LCP on the large hero headline and is the first thing to tune against a real CDN.

## Real backend (next phase)
```bash
cp .env.example .env.local
npm run db:start && npm run db:reset      # local Supabase with seed
```
Set `NEXT_PUBLIC_DATA_MODE=supabase` (before `npm run build`) to use real OTP login. Demo accounts and test OTPs are in `supabase/config.toml` / `supabase/seed.sql`. Row-level security is the tenant boundary (hosts, planners' organisations, door staff, admins); `tests/db.test.ts` verifies it against the real migrations.

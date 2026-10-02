# Dawati (دعواتي)

Bilingual (Arabic RTL + English) WhatsApp-native event invitation platform for Saudi Arabia (Riyadh, Jeddah).

> Status: **Milestone 1: design system and landing page.** Auth/DB, create-event flow, dashboard, check-in and admin follow. The full README (Supabase setup, messaging contract, deploy) lands with the final milestone.

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · next-intl · Supabase (from milestone 2)

## Getting started
```bash
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3000, redirects to /ar
```

Scripts: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Conventions
- **All copy lives in `messages/ar.json` and `messages/en.json`.** A test enforces identical keys, and `en.json` types `useTranslations`.
- **RTL:** use logical Tailwind utilities (`ms-`, `pe-`, `start-`, `end-`), never `left`/`right`.
- **Pricing:** edit `lib/pricing/config.ts` only; the UI and server both read from it.
- **Design tokens:** `app/globals.css` (`@theme`). Gold text uses `gold-ink` for WCAG AA contrast.

# Stackd

A design-forward link-in-bio tool with a simple public URL, several typography-driven themes, and lightweight analytics.

## Overview

Most link-in-bio products settle on the same crowded layout and upsell-heavy flow. Stackd is built to feel more editorial—clear hierarchy, deliberate type, room for a bio and grouped links—without asking for a credit card.

You claim a username, curate your links (including section headers and optional subtitles), pick a theme, and share one URL in your bio or signature.

## Why I Built This

Most link-in-bio tools look the same, and I wanted something design-forward that stayed free to use. No tiered themes or nag screens, just a minimal page you actually want to send people to.

## Live Demo

[stackdlink.com](https://stackdlink.com/)

## Features

- **Auth** — Google OAuth, email/password (sign-in and sign-up), and magic link; PKCE exchange in `/auth/callback`, then onboarding if no `profiles` row or dashboard if one exists.
- **Onboarding** — Pick a public username (normalized; reserved names rejected).
- **Dashboard** — Edit display name, bio, avatar (storage); theme picker (five presets); toggle social icon row; add/edit/delete links and section rows; drag-to-reorder with persisted `order_index`; enable/disable links; copy public URL.
- **Public profile** — SSR + Open Graph metadata; theme via `data-theme`; share helper; links route through the click API for `click_count`.
- **Analytics** — `@vercel/analytics` in the root layout.

## Tech Stack

### Frontend

- Next.js (App Router) · React 19 · TypeScript
- Tailwind CSS 4
- `@dnd-kit` (sortable lists)
- `@fontsource/*` theme fonts (Metropolis, Playfair Display, Oswald, Petit Formal Script, Fira Code)
- `simple-icons` (+ inline SVG for LinkedIn paths not in the package)

### Backend / data

- Supabase (Auth, Postgres, Storage)
- SQL migrations under `supabase/migrations/` (e.g. link `kind`, subtitle, `increment_link_click` RPC, profile flags)

### Quality / tooling

- ESLint (`npm run lint`)
- Playwright (`npm run test:e2e`) — auth setup project + public + authenticated specs

## Architecture / How It Works

**Supabase clients** — Browser client for dashboard mutations; server client with cookie handling for RSC routes, API routes, and middleware (`@supabase/ssr`).

**Middleware** — Refreshes the session and redirects anonymous users away from `/dashboard` and `/onboarding`. For paths that look like `/<username>`, applies a simple per-IP rate limit (in-memory; skipped when a Supabase session cookie is present). Comments in `middleware.ts` note limits for multi-instance deploys.

**Profile creation** — Not in the OAuth callback. After first sign-in, `/onboarding` calls `insertProfileForNewUser` once the username is accepted.

**Public page** — `React.cache` wraps the profile fetch so `generateMetadata` and the page share one DB round-trip per request. Links include enabled rows and section rows (`kind === 'section'`) for layout; outbound URLs use `/api/click/[linkId]`.

**Click route** — Loads the link, rejects non-http(s) URLs and section rows, calls `increment_link_click` via RPC (atomic increment), then redirects.

## Technical Highlights

- **Optimistic reorder** — `useLinks` updates local order immediately; `upsert` persists `order_index`; rolls back on error.
- **Theme continuity** — Dashboard preview can persist the selected theme to `localStorage`; a small inline script on `/dashboard` reapplies `data-theme` before paint to avoid flash.
- **Social row** — `detectPlatform` maps known domains to icons; first match per platform in link order; gated by `show_social_icons` on the profile.
- **E2E** — `e2e/auth.setup.ts` uses the service role key (see `.env.example`) with `TEST_USER_EMAIL` / `TEST_USERNAME` for authenticated flows; public tests skip profile checks if `TEST_USERNAME` is unset.

## Future Improvements

- [ ] Broader automated tests (unit/component; expand Playwright coverage).
- [ ] Distributed rate limiting if traffic justifies it.
- [ ] Analytics beyond raw `click_count` if product direction needs it.
- [ ] Accessibility pass on dashboard and public profile (focus order, contrast audits).

## Screenshots

Coming soon.

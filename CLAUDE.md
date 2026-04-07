# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured.

## Architecture

**Stackd** is a link-in-bio app (like Linktree). Users log in, manage a list of links, and share a public profile at `/<username>`.

### Stack
- Next.js App Router (v16 — see AGENTS.md warning)
- React 19 + TypeScript, Tailwind CSS 4
- Supabase for auth, database, and storage
- `@dnd-kit` for drag-to-reorder links

### Key routes
| Route | Type | Purpose |
|---|---|---|
| `/` | Server | Redirects to `/dashboard` (authed) or `/login` |
| `/login` | Client | Google OAuth, email/password sign-in, sign-up, and magic link |
| `/auth/callback` | Server | Exchanges PKCE code (magic link, Google, password confirm); redirects to `/onboarding` if no profile, `/dashboard` if profile exists |
| `/onboarding` | Client | Protected; new users choose a public username and create their profile |
| `/dashboard` | Client | Protected link/profile editor |
| `/[username]` | Server | Public profile (SSR) |
| `/api/click/[linkId]` | API Route | Increments `click_count`, redirects to URL |

`middleware.ts` guards `/dashboard/*` and `/onboarding/*` — unauthenticated requests redirect to `/login`.

### Auth flows
All three entry points converge on the same onboarding path for new users:
- **Google OAuth** — `signInWithOAuth` → Supabase → `/auth/callback` → `/onboarding` (new) or `/dashboard` (returning)
- **Magic link** — `signInWithOtp` → email → `/auth/callback` → same
- **Password sign-up** — `signUp`; if email confirmation is enabled, confirmation link → `/auth/callback` → `/onboarding`; if disabled, immediate session → client redirects to `/onboarding`
- **Password sign-in** — `signInWithPassword` → client redirects to `/dashboard`; `useProfile` redirects to `/onboarding` if no profile row exists

Profile rows are **never** created in `/auth/callback`. The `/onboarding` page calls `insertProfileForNewUser` (`src/lib/create-initial-profile.ts`) once the user submits a username.

### Supabase client split
- `src/lib/supabase/client.ts` — browser context (`createBrowserClient`)
- `src/lib/supabase/server.ts` — server/middleware context (`createServerClient` with cookie handling)

Always use the correct client for the rendering context.

### Database tables (inferred)
- **`profiles`**: `id`, `user_id`, `username`, `display_name`, `bio`, `theme`, `avatar_url`, `show_social_icons`
- **`links`**: `id`, `profile_id`, `title`, `url`, `order_index`, `enabled`, `click_count`
- **`avatars`** storage bucket: public, for user avatar images

### Theming
Five presets (`default`, `retro`, `noir`, `soft`, `terminal`) defined as CSS custom properties in `src/app/globals.css` via `[data-theme]` attribute. Each preset sets `--bg`, `--text`, `--divider`, `--accent`, `--muted`, `--surface`, and `--font-family`. The `default` preset maps to `:root` (no `data-theme` attribute). Components use React inline styles referencing these vars.

| Preset | Font |
|---|---|
| default | Metropolis |
| retro | Playfair Display |
| noir | Oswald |
| soft | Petit Formal Script |
| terminal | Fira Code |

### Path alias
`@/*` maps to `./src/*` (configured in `tsconfig.json`).

### Environment variables
See `.env.example` for the full list. Required at minimum:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=        # must match Supabase Auth redirect allowlist
```

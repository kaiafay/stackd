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
| `/login` | Client | Supabase email OTP magic link |
| `/auth/callback` | Server | Exchanges OAuth code, creates profile on first login |
| `/dashboard` | Client | Protected link/profile editor |
| `/[username]` | Server | Public profile (SSR) |
| `/api/click/[linkId]` | API Route | Increments `click_count`, redirects to URL |

`middleware.ts` guards `/dashboard/*` — unauthenticated requests redirect to `/login`.

### Supabase client split
- `src/lib/supabase/client.ts` — browser context (`createBrowserClient`)
- `src/lib/supabase/server.ts` — server/middleware context (`createServerClient` with cookie handling)

Always use the correct client for the rendering context.

### Database tables (inferred)
- **`profiles`**: `id`, `user_id`, `username`, `display_name`, `bio`, `theme`, `avatar_url`
- **`links`**: `id`, `profile_id`, `title`, `url`, `order_index`, `enabled`, `click_count`
- **`avatars`** storage bucket: public, for user avatar images

### Theming
Three themes (`light`, `dark`, `color`) defined as CSS custom properties in `src/app/globals.css` via `[data-theme]` attribute. Variables: `--bg`, `--text`, `--divider`, `--accent`, `--muted`, `--surface`. Components use React inline styles referencing these vars.

### Path alias
`@/*` maps to `./src/*` (configured in `tsconfig.json`).

### Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

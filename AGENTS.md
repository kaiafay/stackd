<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Services

| Service | Command | Notes |
|---|---|---|
| Next.js dev server | `npm run dev` | Runs on `localhost:3000`. All backend logic runs inside this single process. |
| Supabase | External (cloud) | No local Supabase; requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars in `.env.local`. |

### Running the app

- `npm run dev` starts the dev server (Turbopack). Ready in ~300ms.
- The dev server reads `.env.local` for Supabase credentials. Without valid Supabase credentials, the app renders pages but auth/database operations will fail at runtime.
- `NEXT_PUBLIC_SITE_URL` must be `http://localhost:3000` for local dev (must match Supabase Auth redirect allowlist).

### Lint / Build / Test

- **Lint**: `npm run lint` (ESLint 9, flat config via `eslint-config-next`)
- **Build**: `npm run build` (verifies TypeScript + generates production output)
- **E2E tests**: `npm run test:e2e` (Playwright; requires `SUPABASE_SERVICE_ROLE_KEY`, `TEST_USER_EMAIL`, `TEST_USERNAME` env vars and a running dev server)

### Creating test users for manual testing

Email confirmation is enabled on the Supabase project. To create a pre-confirmed test user for sign-in:

```bash
curl -s -X POST "${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD","email_confirm":true}'
```

Note: Use `SUPABASE_SERVICE_ROLE_KEY` as **both** the `apikey` header and the `Authorization: Bearer` token (it is not a standard JWT in this project's Supabase instance).

### Gotchas

- No `.env.example` is committed; see `CLAUDE.md` for the required env var list.
- The app uses Next.js 16 with Turbopack — some APIs differ from Next.js 14/15. Always check `node_modules/next/dist/docs/` for current API docs.
- `.env.local` is gitignored — each agent session needs it recreated if Supabase secrets are injected as environment variables. The update script handles this automatically when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present in the environment.
- The `SUPABASE_SERVICE_ROLE_KEY` in this project uses a non-standard format (`sb_secret_...`) rather than a JWT. Pass it as both `apikey` and `Authorization: Bearer` headers for admin API calls.

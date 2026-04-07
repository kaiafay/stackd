import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Simple in-memory rate limiter for public profile pages.
// Applies to ALL requests (authenticated and unauthenticated) unless a
// Supabase session cookie is present — authenticated users are skipped.
// Note: in-memory only; not shared across instances. Replace with a
// distributed store (e.g. Upstash Redis) for multi-instance deployments.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // requests per window per IP
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const active = (rateLimitMap.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  active.push(now);
  rateLimitMap.set(ip, active);

  // Occasionally sweep all entries to prevent unbounded map growth across
  // many distinct IPs. Runs on ~1% of requests to amortize cost.
  if (Math.random() < 0.01) {
    for (const [key, ts] of rateLimitMap) {
      if (ts.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        rateLimitMap.delete(key);
      }
    }
  }

  return active.length > RATE_LIMIT_MAX;
}

// Matches single-segment paths that could be username routes.
// Tightened to [a-zA-Z0-9] so unknown top-level routes (e.g. /pricing)
// are not counted as profile traffic unless they fit the username charset.
const PROFILE_ROUTE_RE = /^\/[a-zA-Z0-9]+$/;

// Known single-segment app routes that are not profile pages.
const NON_PROFILE_ROUTES = new Set(["/login", "/dashboard", "/onboarding"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate-limit requests to /<username> routes.
  if (PROFILE_ROUTE_RE.test(pathname) && !NON_PROFILE_ROUTES.has(pathname)) {
    // Skip rate limiting for requests that carry a Supabase session cookie.
    // @supabase/ssr names cookies "sb-<project-ref>-auth-token" (possibly
    // chunked as "sb-…-auth-token.0"). Token is not re-validated here —
    // this is a UX heuristic to avoid 429ing logged-in users.
    const hasSession = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

    if (!hasSession) {
      // Prefer the first hop from x-forwarded-for; fall back to a shared
      // "unknown" bucket (stricter but unfair under NAT — acceptable for now).
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown";
      if (isRateLimited(ip)) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: { "Retry-After": "60" },
        });
      }
    }
  }

  // Only run the Supabase session refresh and auth guard for protected app routes —
  // avoids the getUser() round-trip overhead on public pages.
  const isProtectedAppRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
  if (!isProtectedAppRoute) {
    return NextResponse.next({ request });
  }

  const supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/((?!_next|api|favicon.ico).+)",
  ],
};

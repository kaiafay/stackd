import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Simple in-memory rate limiter for public profile pages.
// Limits unauthenticated enumeration; not a substitute for a distributed
// solution (e.g. Upstash) in a multi-instance deployment.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // requests per window per IP
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export async function middleware(request: NextRequest) {
  // Rate-limit unauthenticated requests to public profile pages.
  // Exclude known app routes so only /<username> paths are counted.
  const KNOWN_ROUTES = new Set(["/login", "/dashboard", "/auth"]);
  const { pathname } = request.nextUrl;
  const isProfileRoute =
    /^\/[^/]+$/.test(pathname) &&
    !KNOWN_ROUTES.has(pathname) &&
    !pathname.startsWith("/auth/");
  if (isProfileRoute) {
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

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/((?!_next|api|favicon.ico).+)"],
};

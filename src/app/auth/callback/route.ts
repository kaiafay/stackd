import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? requestUrl.origin).replace(/\/$/, "");

  const oauthError = searchParams.get("error");
  if (oauthError) {
    const errorDescription = searchParams.get("error_description");
    if (oauthError === "access_denied") {
      console.warn("[auth/callback] OAuth cancelled by user");
    } else {
      console.error("[auth/callback] OAuth error:", oauthError, errorDescription ?? "");
    }
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (!data.user.email) {
        return NextResponse.redirect(`${origin}/login?error=auth`);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!profile) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

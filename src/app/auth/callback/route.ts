import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function deriveUsername(email: string): string {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
  return base.slice(0, 30);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if profile exists, create one if not
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", data.user.id)
        .single();

      if (!profile) {
        if (!data.user.email) {
          return NextResponse.redirect(`${origin}/login?error=auth`);
        }
        const username = deriveUsername(data.user.email);
        const { error: insertError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          username,
          display_name: username,
        });

        if (insertError) {
          console.error("[auth/callback] profile insert failed, retrying with suffix:", insertError.message);
          const suffixedUsername = `${username.slice(0, 25)}${Math.floor(1000 + Math.random() * 9000)}`;
          const { error: retryError } = await supabase.from("profiles").insert({
            user_id: data.user.id,
            username: suffixedUsername,
            display_name: suffixedUsername,
          });
          if (retryError) {
            console.error("[auth/callback] profile insert retry failed:", retryError.message);
            return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`);
          }
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types";

// PostgREST error code for "no rows matched .single()" — treated as not-found,
// not as a DB error. Any other code is a real error worth surfacing.
const PGRST_NO_ROWS = "PGRST116";

/**
 * Fetches a public profile by username.
 * Returns null if no profile exists for that username.
 * Throws on real DB / network errors so callers can distinguish not-found
 * from transient failures (avoids surfacing a 404 for a 500-class error).
 * Used by the public profile server component.
 */
export async function fetchProfileByUsername(
  supabase: SupabaseClient,
  username: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  if (error) {
    if (error.code === PGRST_NO_ROWS) return null;
    throw new Error(error.message);
  }
  return (data as Profile) ?? null;
}

/**
 * Fetches the profile for an authenticated user by their auth user ID.
 * Returns null if no profile row exists for that user.
 * Throws on real DB / network errors so callers can distinguish missing
 * profiles from transient failures.
 * Includes a defense-in-depth ownership check against RLS misconfiguration.
 * Used by the dashboard client hook.
 */
export async function fetchProfileByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) {
    if (error.code === PGRST_NO_ROWS) return null;
    throw new Error(error.message);
  }
  if (!data || data.user_id !== userId) return null;
  return data as Profile;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types";

/**
 * Fetches a public profile by username.
 * Returns null if the profile does not exist.
 * Used by the public profile server component.
 */
export async function fetchProfileByUsername(
  supabase: SupabaseClient,
  username: string,
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  return (data as Profile) ?? null;
}

/**
 * Fetches the profile for an authenticated user by their auth user ID.
 * Returns null if not found.
 * Includes a defense-in-depth check that the returned row actually belongs
 * to the requested user, guarding against RLS misconfiguration.
 * Used by the dashboard client hook.
 */
export async function fetchProfileByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (!data || data.user_id !== userId) return null;
  return data as Profile;
}

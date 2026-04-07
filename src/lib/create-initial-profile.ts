import type { SupabaseClient } from "@supabase/supabase-js";
import { isReserved, normalizeUsername } from "@/lib/username";
import type { Profile } from "@/types";

export type InsertProfileForNewUserResult =
  | { ok: true; profile: Profile }
  | {
      ok: false;
      error: "invalid" | "reserved" | "taken" | "unknown";
      message?: string;
    };

/**
 * Inserts a first-time profile for the signed-in user. Does not silently
 * change the username on unique violations — callers should show "taken."
 */
export async function insertProfileForNewUser(
  supabase: SupabaseClient,
  {
    userId,
    username,
    email,
  }: {
    userId: string;
    username: string;
    email?: string | null;
  },
): Promise<InsertProfileForNewUserResult> {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    return { ok: false, error: "invalid" };
  }
  if (isReserved(normalized)) {
    return { ok: false, error: "reserved" };
  }

  const localFromEmail = email?.includes("@")
    ? email.split("@")[0]?.trim()
    : null;
  const display_name = localFromEmail || normalized;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      username: normalized,
      display_name,
      bio: null,
      theme: "default",
      avatar_url: null,
      show_social_icons: false,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "taken" };
    }
    return { ok: false, error: "unknown", message: error.message };
  }

  return { ok: true, profile: data as Profile };
}

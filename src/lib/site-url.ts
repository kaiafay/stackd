/**
 * Canonical site origin for client-side redirects (magic link, OAuth).
 * Prefer NEXT_PUBLIC_SITE_URL so production matches Supabase redirect allowlist.
 */
export function getBrowserSiteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(
    /\/$/,
    "",
  );
}

/**
 * Canonical public profile URL. Safe in both server and browser contexts
 * (falls back to "" origin server-side, which is fine for metadata/sharing).
 */
export function getProfileUrl(username: string): string {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin.replace(/\/$/, "")}/${username}`;
}

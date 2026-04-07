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

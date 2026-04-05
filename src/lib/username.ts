export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

const RAW_RESERVED = [
  "login", "logout", "dashboard", "api", "auth", "admin",
  "settings", "profile", "404", "notfound",
];

export const RESERVED_USERNAMES = new Set(RAW_RESERVED.map(normalizeUsername));

export function isReserved(username: string): boolean {
  return RESERVED_USERNAMES.has(normalizeUsername(username));
}

export type Profile = {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  theme: string;
  avatar_url: string | null;
  show_social_icons: boolean;
};

export const THEMES = ["default", "retro", "noir", "soft", "terminal"] as const;
export type Theme = (typeof THEMES)[number];

/** Runtime guard — use instead of `as Theme` when the value comes from the DB. */
export function isValidTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export type Link = {
  id: string;
  profile_id: string;
  title: string;
  subtitle: string | null;
  url: string | null;
  order_index: number;
  enabled: boolean;
  click_count: number;
  kind: "link" | "section";
};

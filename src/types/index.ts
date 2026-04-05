export type Profile = {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  theme: string;
  avatar_url: string | null;
};

export type Theme = "default" | "retro" | "noir" | "soft" | "terminal";

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

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  theme: string;
  avatar_url: string | null;
};

export type Theme = "light" | "dark" | "color";

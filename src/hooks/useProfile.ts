"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Theme } from "@/types";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute(
    "data-theme",
    theme === "default" ? "" : theme,
  );
}

export function useProfile(onUnauthenticated: () => void) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const [theme, setTheme] = useState<Theme>("default");
  const [showSocialIcons, setShowSocialIcons] = useState(false);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    const timer = setTimeout(() => setShowSpinner(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function fetchProfile(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      // Defense-in-depth: verify the returned row belongs to this user.
      if (data && data.user_id === userId) {
        setProfile(data);
        const t = (data.theme as Theme) ?? "default";
        setTheme(t);
        setShowSocialIcons(data.show_social_icons ?? false);
        applyTheme(t);
      }
    }

    // Initial auth check.
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        onUnauthenticated();
      } else {
        fetchProfile(user.id);
      }
    });

    // Also re-fetch when the session changes mid-session (fixes empty-deps race).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setProfile(null);
        onUnauthenticated();
      } else if (event === "SIGNED_IN" && session.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
      document.documentElement.removeAttribute("data-theme");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleThemeChange(newTheme: Theme) {
    if (!profile) return;
    const prevTheme = theme;
    setTheme(newTheme);
    applyTheme(newTheme);
    const { error } = await supabase
      .from("profiles")
      .update({ theme: newTheme })
      .eq("id", profile.id);
    if (error) {
      // Rollback optimistic update on failure.
      setTheme(prevTheme);
      applyTheme(prevTheme);
    } else {
      setProfile((prev) => (prev ? { ...prev, theme: newTheme } : prev));
    }
  }

  async function handleToggleSocialIcons() {
    if (!profile) return;
    const next = !showSocialIcons;
    const prevShowSocialIcons = showSocialIcons;
    const prevProfile = profile;
    setShowSocialIcons(next);
    setProfile((prev) => (prev ? { ...prev, show_social_icons: next } : prev));
    const { error } = await supabase
      .from("profiles")
      .update({ show_social_icons: next })
      .eq("id", profile.id);
    if (error) {
      // Rollback optimistic updates on failure.
      setShowSocialIcons(prevShowSocialIcons);
      setProfile(prevProfile);
    }
  }

  return {
    profile,
    setProfile,
    showSpinner,
    theme,
    showSocialIcons,
    handleThemeChange,
    handleToggleSocialIcons,
  };
}

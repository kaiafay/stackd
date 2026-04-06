"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchProfileByUserId } from "@/lib/db/profiles";
import { isValidTheme } from "@/types";
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
  const [profileError, setProfileError] = useState(false);
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
      try {
        const data = await fetchProfileByUserId(supabase, userId);
        if (data) {
          setProfileError(false);
          setProfile(data);
          const t: Theme = isValidTheme(data.theme) ? data.theme : "default";
          setTheme(t);
          setShowSocialIcons(data.show_social_icons ?? false);
          applyTheme(t);
        } else {
          // Authenticated but no profile row — something went wrong during
          // account creation. Surface an error rather than spinning forever.
          setProfileError(true);
        }
      } catch {
        // Real DB / network error — surface the same error state so the
        // user sees a message rather than an infinite spinner.
        setProfileError(true);
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
    profileError,
    theme,
    showSocialIcons,
    handleThemeChange,
    handleToggleSocialIcons,
  };
}

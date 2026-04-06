"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isReserved, normalizeUsername } from "@/lib/username";
import type { Profile } from "@/types";

export function useUsernameEditor(
  profile: Profile | null,
  onSaved: (username: string) => void,
) {
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const emptyWarned = useRef(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Clean up the flash timer on unmount.
  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  function startEditing() {
    setEditing(true);
    setValue(profile?.username ?? "");
  }

  function handleChange(raw: string) {
    emptyWarned.current = false;
    setValue(raw.toLowerCase().replace(/[^a-z0-9]/g, ""));
  }

  async function save() {
    if (!value.trim()) {
      if (emptyWarned.current) {
        // Second submission with empty value — cancel and revert.
        setValue(profile?.username ?? "");
        setError("");
        setEditing(false);
        emptyWarned.current = false;
      } else {
        setError("username can't be empty");
        emptyWarned.current = true;
      }
      return;
    }

    const normalized = normalizeUsername(value);
    setError("");
    emptyWarned.current = false;

    if (isReserved(normalized)) {
      setError("that username is reserved");
      return;
    }

    if (!profile) return;

    const { error: dbError } = await supabase
      .from("profiles")
      .update({ username: normalized })
      .eq("id", profile.id);

    if (dbError) {
      setError(
        dbError.code === "23505"
          ? "that username is already taken"
          : "couldn't save username — try again",
      );
    } else {
      setEditing(false);
      onSaved(normalized);
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2000);
    }
  }

  return { value, editing, saved, error, startEditing, handleChange, save };
}

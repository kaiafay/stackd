"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function useAvatarUpload(
  profile: Profile,
  onSave: (updated: { avatar_url: string }) => void,
) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setUploading(false);
      return;
    }

    // Validate MIME type against an explicit allowlist — do not trust file.name extension.
    const fileExt = ALLOWED_MIME_TYPES[file.type];
    if (!fileExt) {
      setError("Only JPEG, PNG, and WebP images are allowed.");
      setUploading(false);
      return;
    }

    // Capture old path before any mutations so we can clean up after success.
    const oldPath = profile.avatar_url
      ? profile.avatar_url.split("/avatars/")[1]?.split("?")[0] ?? null
      : null;

    const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;

    // 1. Upload new file.
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const newUrl = data.publicUrl;

    // 2. Update DB — if this fails, roll back the upload so nothing is orphaned.
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: newUrl })
      .eq("id", profile.id);
    if (profileError) {
      await supabase.storage.from("avatars").remove([filePath]);
      setError(profileError.message);
      setUploading(false);
      return;
    }

    // 3. Both succeeded — update state, then remove old file.
    setAvatarUrl(newUrl);
    onSave({ avatar_url: newUrl });
    e.target.value = "";
    setUploading(false);

    if (oldPath) {
      await supabase.storage.from("avatars").remove([oldPath]);
      // Ignore delete errors — a stale orphan is acceptable.
    }
  }

  return { avatarUrl, uploading, error, fileInputRef, handleFileChange };
}

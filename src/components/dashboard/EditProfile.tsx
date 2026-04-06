"use client";

import { useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Link } from "@/types";
import { inputStyle, sectionLabelStyle } from "@/styles/shared";
import SocialIconRow from "@/components/SocialIconRow";

type Props = {
  profile: Profile;
  onSave: (updated: Partial<Profile>) => void;
  links?: Link[];
};

export default function EditProfile({ profile, onSave, links }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");

  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [avatarError, setAvatarError] = useState("");
  const [dnSaved, setDnSaved] = useState(false);
  const [dnError, setDnError] = useState("");
  const [bioSaved, setBioSaved] = useState(false);
  const [bioError, setBioError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  function flashSaved(setter: (v: boolean) => void) {
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setAvatarError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAvatarError("Not authenticated");
      setUploading(false);
      return;
    }
    // Validate MIME type against an explicit allowlist — do not trust file.name extension
    const ALLOWED_MIME_TYPES: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const fileExt = ALLOWED_MIME_TYPES[file.type];
    if (!fileExt) {
      setAvatarError("Only JPEG, PNG, and WebP images are allowed.");
      setUploading(false);
      return;
    }

    // Capture old path before any mutations so we can clean up after success
    const oldPath = profile.avatar_url
      ? profile.avatar_url.split("/avatars/")[1]?.split("?")[0] ?? null
      : null;

    const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;

    // 1. Upload new file
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);
    if (uploadError) {
      setAvatarError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const newUrl = data.publicUrl;

    // 2. Update DB — if this fails, roll back the upload so nothing is orphaned
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: newUrl })
      .eq("id", profile.id);
    if (profileError) {
      await supabase.storage.from("avatars").remove([filePath]);
      setAvatarError(profileError.message);
      setUploading(false);
      return;
    }

    // 3. Both succeeded — update state, then remove old file
    setAvatarUrl(newUrl);
    onSave({ avatar_url: newUrl });
    e.target.value = "";
    setUploading(false);

    if (oldPath) {
      await supabase.storage.from("avatars").remove([oldPath]);
      // Ignore delete errors — a stale orphan is acceptable
    }
  }

  async function saveDisplayName() {
    setDnError("");
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", profile.id);
    if (error) {
      setDnError(error.message);
    } else {
      setEditingDisplayName(false);
      onSave({ display_name: displayName });
      flashSaved(setDnSaved);
    }
  }

  async function saveBio() {
    setBioError("");
    const { error } = await supabase
      .from("profiles")
      .update({ bio })
      .eq("id", profile.id);
    if (error) {
      setBioError(error.message);
    } else {
      setEditingBio(false);
      onSave({ bio });
      flashSaved(setBioSaved);
    }
  }

  const labelStyle = { ...sectionLabelStyle, display: "block", marginBottom: "4px" } as React.CSSProperties;

  const textStyle: React.CSSProperties = {
    fontSize: "13px",
    fontFamily: "Metropolis, sans-serif",
    color: "var(--text)",
    padding: "2px 0",
    cursor: "text",
    display: "flex",
    alignItems: "center",
  };

  return (
    <div
      style={{
        padding: "16px 24px 20px",
        borderBottom: "1px solid var(--divider)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "14px" }}>
      {/* Avatar with pencil badge */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          position: "relative",
          width: "52px",
          height: "52px",
          cursor: uploading ? "not-allowed" : "pointer",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            backgroundColor: "var(--divider)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--muted)",
            overflow: "hidden",
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            (profile.display_name || profile.username).charAt(0).toUpperCase()
          )}
        </div>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: "var(--accent)",
            border: "2px solid var(--bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: uploading ? 0.5 : 1,
          }}
        >
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--bg)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarUpload}
          style={{ display: "none" }}
        />
      </div>

      {/* Display name + bio */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Display name */}
        <div>
          <label style={labelStyle}>
            Display name
            <span
              style={{
                marginLeft: "8px",
                fontWeight: 400,
                letterSpacing: 0,
                textTransform: "none",
                opacity: dnSaved ? 1 : 0,
                transition: "opacity 0.5s",
                color: "var(--muted)",
              }}
            >
              saved ✓
            </span>
          </label>
          {editingDisplayName ? (
            <input
              autoFocus
              style={inputStyle}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={saveDisplayName}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.target as HTMLInputElement).blur()
              }
              placeholder="Your name"
            />
          ) : (
            <div onClick={() => { setEditingDisplayName(true); setDisplayName(profile.display_name ?? ""); }} style={textStyle}>
              {profile.display_name || (
                <span style={{ color: "var(--muted)" }}>Your name</span>
              )}
            </div>
          )}
          {dnError && (
            <p style={{ fontSize: "11px", color: "var(--error)", marginTop: "4px" }}>
              {dnError}
            </p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label style={labelStyle}>
            Bio
            <span
              style={{
                marginLeft: "8px",
                fontWeight: 400,
                letterSpacing: 0,
                textTransform: "none",
                opacity: bioSaved ? 1 : 0,
                transition: "opacity 0.5s",
                color: "var(--muted)",
              }}
            >
              saved ✓
            </span>
          </label>
          {editingBio ? (
            <textarea
              autoFocus
              style={{ ...inputStyle, resize: "vertical", minHeight: "60px" }}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onBlur={saveBio}
              placeholder="A short bio"
            />
          ) : (
            <div onClick={() => { setEditingBio(true); setBio(profile.bio ?? ""); }} style={textStyle}>
              {profile.bio || (
                <span style={{ color: "var(--muted)" }}>A short bio</span>
              )}
            </div>
          )}
          {bioError && (
            <p style={{ fontSize: "11px", color: "var(--error)", marginTop: "4px" }}>
              {bioError}
            </p>
          )}
        </div>
      </div>
      </div>
      {profile.show_social_icons && links && (
        <SocialIconRow links={links} interactive={false} style={{ paddingTop: "12px" }} />
      )}
      {avatarError && (
        <p style={{ fontSize: "11px", color: "var(--error)" }}>
          {avatarError}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

type Props = {
  profile: Profile;
  onSave: (updated: Partial<Profile>) => void;
  onCancel: () => void;
};

export default function EditProfile({ profile, onSave, onCancel }: Props) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
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

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        bio,
        username,
        avatar_url: avatarUrl,
      })
      .eq("id", profile.id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    onSave({ display_name: displayName, bio, username, avatar_url: avatarUrl });
    setSaving(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "var(--bg)",
    border: "1px solid var(--divider)",
    borderRadius: "4px",
    padding: "9px 12px",
    fontSize: "13px",
    fontFamily: "Metropolis, sans-serif",
    color: "var(--text)",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    color: "var(--muted)",
    display: "block",
    marginBottom: "6px",
  };

  return (
    <div
      style={{
        padding: "16px 24px 20px",
        borderBottom: "1px solid var(--divider)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Avatar upload */}
      <div>
        <label style={labelStyle}>Avatar</label>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              backgroundColor: "var(--divider)",
              backgroundImage: avatarUrl ? `url(${avatarUrl})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 600,
              color: "var(--muted)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {!avatarUrl &&
              (displayName || profile.username).charAt(0).toUpperCase()}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              fontSize: "12px",
              fontWeight: 500,
              fontFamily: "Metropolis, sans-serif",
              background: "none",
              color: "var(--muted)",
              border: "1px solid var(--divider)",
              borderRadius: "4px",
              padding: "7px 14px",
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? "Uploading..." : "Upload photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* Display name */}
      <div>
        <label style={labelStyle}>Display name</label>
        <input
          style={inputStyle}
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      {/* Bio */}
      <div>
        <label style={labelStyle}>Bio</label>
        <input
          style={inputStyle}
          type="text"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short bio"
        />
      </div>

      {/* Username */}
      <div>
        <label style={labelStyle}>Username</label>
        <input
          style={inputStyle}
          type="text"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))
          }
          placeholder="username"
        />
        <p
          style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}
        >
          stackd.app/{username}
        </p>
      </div>

      {error && <p style={{ fontSize: "12px", color: "#C0735A" }}>{error}</p>}

      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          style={{
            fontSize: "12px",
            fontWeight: 500,
            fontFamily: "Metropolis, sans-serif",
            backgroundColor: "var(--accent)",
            color: "var(--bg)",
            border: "none",
            borderRadius: "4px",
            padding: "7px 16px",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving || uploading ? 0.6 : 1,
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          style={{
            fontSize: "12px",
            fontWeight: 500,
            fontFamily: "Metropolis, sans-serif",
            background: "none",
            color: "var(--muted)",
            border: "1px solid var(--divider)",
            borderRadius: "4px",
            padding: "7px 16px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

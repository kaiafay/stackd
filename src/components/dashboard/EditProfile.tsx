"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
};

type Props = {
  profile: Profile;
  onSave: (updated: Partial<Profile>) => void;
  onCancel: () => void;
};

export default function EditProfile({ profile, onSave, onCancel }: Props) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [username, setUsername] = useState(profile.username);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSave() {
    setSaving(true);
    setError("");

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, bio, username })
      .eq("id", profile.id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    onSave({ display_name: displayName, bio, username });
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
      <div>
        <label
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            color: "var(--muted)",
            display: "block",
            marginBottom: "6px",
          }}
        >
          Display name
        </label>
        <input
          style={inputStyle}
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          autoFocus
        />
      </div>

      <div>
        <label
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            color: "var(--muted)",
            display: "block",
            marginBottom: "6px",
          }}
        >
          Bio
        </label>
        <input
          style={inputStyle}
          type="text"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short bio"
        />
      </div>

      <div>
        <label
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            color: "var(--muted)",
            display: "block",
            marginBottom: "6px",
          }}
        >
          Username
        </label>
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
          disabled={saving}
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
            opacity: saving ? 0.6 : 1,
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

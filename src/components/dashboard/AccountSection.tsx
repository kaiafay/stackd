"use client";

import { useState, useRef, useEffect } from "react";
import { useUsernameEditor } from "@/hooks/useUsernameEditor";
import { sectionLabelStyle } from "@/styles/shared";
import type { Profile } from "@/types";

type Props = {
  profile: Profile;
  onUsernameChange: (username: string) => void;
  showSocialIcons: boolean;
  onToggleSocialIcons: () => void;
};

export default function AccountSection({
  profile,
  onUsernameChange,
  showSocialIcons,
  onToggleSocialIcons,
}: Props) {
  const { value, editing, saved, error, startEditing, handleChange, save } =
    useUsernameEditor(profile, onUsernameChange);

  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  function handleCopy() {
    const url = `${(process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "")}/${profile.username}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  const sectionLabel = {
    ...sectionLabelStyle,
    marginBottom: "12px",
  } as React.CSSProperties;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--divider)",
    borderRadius: "4px",
    padding: "9px 12px",
    fontSize: "13px",
    fontFamily: "Metropolis, sans-serif",
    color: "var(--text)",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "24px 24px 0" }}>
      <div style={sectionLabel}>Account</div>

      {/* Username */}
      <div
        style={{
          marginBottom: "4px",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        Username
        <span
          style={{
            marginLeft: "8px",
            fontWeight: 400,
            letterSpacing: 0,
            textTransform: "none",
            opacity: saved ? 1 : 0,
            transition: "opacity 0.5s",
            color: "var(--accent)",
          }}
        >
          updated — your public URL has changed ✓
        </span>
      </div>

      {editing ? (
        <input
          autoFocus
          style={inputStyle}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          placeholder="username"
        />
      ) : (
        <div
          onClick={startEditing}
          style={{
            fontSize: "13px",
            fontFamily: "Metropolis, sans-serif",
            color: "var(--text)",
            padding: "2px 0",
            cursor: "text",
          }}
        >
          {profile.username}
        </div>
      )}

      <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
        Your username is your public profile URL:{" "}
        {`${(process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "")}/${profile.username}`}
      </p>

      <button
        onClick={handleCopy}
        style={{
          marginTop: "8px",
          fontSize: "12px",
          fontWeight: 500,
          fontFamily: "Metropolis, sans-serif",
          color: "var(--accent)",
          background: "none",
          border: "1px solid var(--accent)",
          borderRadius: "4px",
          padding: "6px 14px",
          cursor: "pointer",
        }}
      >
        {copied ? "Copied!" : "Copy my link"}
      </button>

      {error && (
        <p style={{ fontSize: "11px", color: "var(--error)", marginTop: "4px" }}>
          {error}
        </p>
      )}

      {/* Social icons toggle */}
      <div style={{ marginTop: "20px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: "8px",
          }}
        >
          Social icons
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label
            style={{
              position: "relative",
              width: "36px",
              height: "20px",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={showSocialIcons}
              onChange={() => onToggleSocialIcons()}
              style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
            />
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "10px",
                backgroundColor: showSocialIcons ? "var(--accent)" : "var(--divider)",
                transition: "background-color 0.2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: showSocialIcons ? "18px" : "2px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: "var(--bg)",
                  transition: "left 0.2s",
                  display: "block",
                }}
              />
            </span>
          </label>
          <div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--text)",
                fontFamily: "Metropolis, sans-serif",
              }}
            >
              Show social icons
            </div>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
              Auto-detected from your links
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

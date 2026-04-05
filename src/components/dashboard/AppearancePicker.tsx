"use client";

import type { Theme } from "@/types";

type Props = {
  current: Theme;
  onChange: (theme: Theme) => void;
};

const themes: { id: Theme; label: string; bg: string; accent: string }[] = [
  { id: "default",  label: "Default",  bg: "#F7F4EF", accent: "#8B7355" },
  { id: "retro",    label: "Retro",    bg: "#F2E8D9", accent: "#C4541A" },
  { id: "noir",     label: "Noir",     bg: "#111111", accent: "#888888" },
  { id: "soft",     label: "Soft",     bg: "#F5EEF0", accent: "#B07A8A" },
  { id: "terminal", label: "Terminal", bg: "#0D0D0D", accent: "#FFB000" },
];

export default function AppearancePicker({ current, onChange }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
      {themes.map((theme) => (
        <div
          key={theme.id}
          onClick={() => onChange(theme.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${theme.bg} 50%, ${theme.accent} 50%)`,
              border: "1.5px solid var(--divider)",
              outline: current === theme.id ? "2px solid var(--accent)" : "none",
              outlineOffset: "2px",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "13px",
              color: current === theme.id ? "var(--text)" : "var(--muted)",
              fontWeight: current === theme.id ? 500 : 400,
            }}
          >
            {theme.label}
          </span>
        </div>
      ))}
    </div>
  );
}

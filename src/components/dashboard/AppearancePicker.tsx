"use client";

type Theme = "light" | "dark" | "color";

type Props = {
  current: Theme;
  onChange: (theme: Theme) => void;
};

const themes: { id: Theme; label: string; bg: string; border?: string }[] = [
  { id: "light", label: "Light", bg: "#F7F4EF", border: "#C8C0B4" },
  { id: "dark", label: "Dark", bg: "#1C1A17" },
  { id: "color", label: "Color", bg: "#6B7F9E" },
];

export default function AppearancePicker({ current, onChange }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
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
              backgroundColor: theme.bg,
              border: `1.5px solid ${theme.border ?? theme.bg}`,
              outline:
                current === theme.id ? "2px solid var(--accent)" : "none",
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

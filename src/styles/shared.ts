import type React from "react";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "var(--bg)",
  border: "1px solid var(--divider)",
  borderRadius: "4px",
  padding: "9px 12px",
  fontSize: "13px",
  fontFamily: "Metropolis, sans-serif",
  color: "var(--text)",
  outline: "none",
  boxSizing: "border-box",
};

export const sectionLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  color: "var(--muted)",
};

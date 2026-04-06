"use client";

import { useState } from "react";
import type { Link } from "@/types";
import { inputStyle } from "@/styles/shared";

type Props = {
  link: Link;
  onUpdate: (
    id: string,
    updates: Partial<Pick<Link, "title" | "subtitle" | "url" | "enabled">>,
  ) => Promise<{ error: { message: string } | null }>;
  onDelete: (id: string) => Promise<{ error: { message: string } | null }>;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
};

export default function SectionHeader({
  link,
  onUpdate,
  onDelete,
  dragHandleProps,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(link.title);
  const [saveError, setSaveError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  async function handleBlur() {
    const trimmed = label.trim();
    if (!trimmed) {
      setLabel(link.title);
      setEditing(false);
      return;
    }
    const { error } = await onUpdate(link.id, { title: trimmed });
    if (error) {
      setSaveError("couldn't save — try again");
    } else {
      setSaveError("");
      setEditing(false);
    }
  }

  async function handleDelete() {
    setDeleteError("");
    const { error } = await onDelete(link.id);
    if (error) setDeleteError("couldn't delete — try again");
  }

  return (
    <div style={{ marginBottom: "4px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
        }}
      >
        <span
          {...dragHandleProps}
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          style={{
            color: "var(--muted)",
            fontSize: "14px",
            cursor: "grab",
            flexShrink: 0,
          }}
        >
          ⠿
        </span>
        {editing ? (
          <input
            autoFocus
            style={{
              ...inputStyle,
              flex: 1,
              fontWeight: 600,
              fontSize: "14px",
            }}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.target as HTMLInputElement).blur()
            }
          />
        ) : (
          <span
            onClick={() => { setSaveError(""); setEditing(true); }}
            style={{
              flex: 1,
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text)",
              cursor: "text",
            }}
          >
            {link.title}
          </span>
        )}
        <button
          aria-label="Delete section"
          onClick={handleDelete}
          style={{
            fontSize: "13px",
            color: "var(--muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            fontFamily: "Metropolis, sans-serif",
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
      {saveError && (
        <p style={{ fontSize: "11px", color: "var(--error)", margin: "0 14px 6px" }}>
          {saveError}
        </p>
      )}
      {deleteError && (
        <p style={{ fontSize: "11px", color: "var(--error)", margin: "0 14px 6px" }}>
          {deleteError}
        </p>
      )}
    </div>
  );
}

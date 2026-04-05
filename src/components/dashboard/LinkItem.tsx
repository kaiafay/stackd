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

export default function LinkItem({
  link,
  onUpdate,
  onDelete,
  dragHandleProps,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(link.title);
  const [subtitle, setSubtitle] = useState(link.subtitle ?? "");
  const [url, setUrl] = useState(link.url);
  const [saveError, setSaveError] = useState("");

  function openEdit() {
    setTitle(link.title);
    setSubtitle(link.subtitle ?? "");
    setUrl(link.url);
    setEditing(true);
  }

  async function handleSave() {
    setSaveError("");
    const { error } = await onUpdate(link.id, { title, subtitle: subtitle || null, url });
    if (error) {
      setSaveError(
        error.message.toLowerCase().includes("fetch")
          ? "couldn't save — check your connection"
          : "save failed — please try again",
      );
    } else {
      setEditing(false);
    }
  }

  function handleCancel() {
    setTitle(link.title);
    setSubtitle(link.subtitle ?? "");
    setUrl(link.url);
    setSaveError("");
    setEditing(false);
  }

  const surface: React.CSSProperties = {
    backgroundColor: "var(--surface)",
    borderRadius: "6px",
    marginBottom: "8px",
    overflow: "hidden",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "13px 14px",
    cursor: "pointer",
  };

  return (
    <div style={surface}>
      <div style={rowStyle} onClick={() => editing ? handleCancel() : openEdit()}>
        <span
          {...dragHandleProps}
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
        <span style={{ flex: 1, overflow: "hidden" }}>
          <span
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {link.title}
          </span>
          {link.subtitle && (
            <span
              style={{
                display: "block",
                fontSize: "11px",
                color: "var(--muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: "2px",
              }}
            >
              {link.subtitle}
            </span>
          )}
        </span>
        {!editing && (
          <>
            <span
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {link.click_count === 1
                ? "1 click"
                : `${link.click_count} clicks`}
            </span>
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: "1px",
                height: "0.9em",
                backgroundColor: "var(--divider)",
                flexShrink: 0,
                alignSelf: "center",
              }}
            />
          </>
        )}
        <span
          style={{ fontSize: "13px", color: "var(--muted)", flexShrink: 0 }}
        >
          ✎
        </span>
      </div>

      {editing && (
        <div
          style={{
            padding: "0 14px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <input
            style={inputStyle}
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            style={inputStyle}
            type="text"
            placeholder="subtitle (optional)"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
          <input
            style={inputStyle}
            type="url"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "2px",
            }}
          >
            <label
              style={{
                position: "relative",
                width: "32px",
                height: "18px",
                flexShrink: 0,
              }}
            >
              <input
                type="checkbox"
                checked={link.enabled}
                onChange={(e) =>
                  onUpdate(link.id, { enabled: e.target.checked })
                }
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: link.enabled
                    ? "var(--accent)"
                    : "var(--divider)",
                  borderRadius: "18px",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    width: "12px",
                    height: "12px",
                    left: link.enabled ? "17px" : "3px",
                    top: "3px",
                    backgroundColor: "white",
                    borderRadius: "50%",
                    transition: "left 0.2s",
                  }}
                />
              </span>
            </label>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Visible on profile
            </span>
          </div>
          {saveError && (
            <p style={{ fontSize: "11px", color: "var(--error)", margin: 0 }}>
              {saveError}
            </p>
          )}
          <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
            <button
              onClick={handleSave}
              style={{
                fontSize: "12px",
                fontWeight: 500,
                fontFamily: "Metropolis, sans-serif",
                backgroundColor: "var(--accent)",
                color: "var(--bg)",
                border: "none",
                borderRadius: "4px",
                padding: "7px 16px",
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              style={{
                fontSize: "12px",
                fontWeight: 500,
                fontFamily: "Metropolis, sans-serif",
                backgroundColor: "transparent",
                color: "var(--muted)",
                border: "1px solid var(--divider)",
                borderRadius: "4px",
                padding: "7px 16px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const { error } = await onDelete(link.id);
                if (error) setSaveError(
                  error.message.toLowerCase().includes("fetch")
                    ? "couldn't delete — check your connection"
                    : "delete failed — please try again",
                );
              }}
              style={{
                fontSize: "12px",
                fontWeight: 500,
                fontFamily: "Metropolis, sans-serif",
                backgroundColor: "transparent",
                color: "var(--error)",
                border: "none",
                padding: "7px 0",
                cursor: "pointer",
                marginLeft: "auto",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

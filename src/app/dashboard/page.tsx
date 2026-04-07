"use client";

import { useState } from "react";
import { useLinks } from "@/hooks/useLinks";
import { useProfile } from "@/hooks/useProfile";
import LinkList from "@/components/dashboard/LinkList";
import AppearancePicker from "@/components/dashboard/AppearancePicker";
import EditProfile from "@/components/dashboard/EditProfile";
import AccountSection from "@/components/dashboard/AccountSection";
import { useRouter } from "next/navigation";
import { inputStyle, sectionLabelStyle } from "@/styles/shared";

export default function DashboardPage() {
  const router = useRouter();
  const {
    profile,
    setProfile,
    profileError,
    theme,
    showSocialIcons,
    handleThemeChange,
    handleToggleSocialIcons,
  } = useProfile({
    onUnauthenticated: () => {
      document.documentElement.removeAttribute("data-theme");
      router.push("/login");
    },
    onMissingProfile: () => router.push("/onboarding"),
  });

  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [sectionError, setSectionError] = useState("");

  const { links, loading, addLink, addSection, updateLink, deleteLink, reorderLinks } =
    useLinks(profile?.id ?? "");

  async function handleAddLink() {
    if (!newTitle.trim() || !newUrl.trim()) return;
    await addLink(newTitle.trim(), newUrl.trim());
    setNewTitle("");
    setNewUrl("");
    setAdding(false);
  }

  if (profileError) {
    return (
      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center" }}>
          Your profile could not be loaded. Please sign out and try again.
        </p>
      </main>
    );
  }

  if (!profile) return null;

  const sectionLabel = { ...sectionLabelStyle, marginBottom: "12px" } as React.CSSProperties;
  const formInputStyle = { ...inputStyle, backgroundColor: "var(--surface)", marginBottom: "8px" } as React.CSSProperties;
  const divider: React.CSSProperties = {
    height: "1px",
    backgroundColor: "var(--divider)",
    margin: "24px 24px 0",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        paddingBottom: "48px",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.8px",
            color: "var(--accent)",
          }}
        >
          stackd
        </span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={() => router.push(`/${profile.username}`)}
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--accent)",
              background: "none",
              border: "1px solid var(--accent)",
              borderRadius: "4px",
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: "Metropolis, sans-serif",
            }}
          >
            Preview →
          </button>
          <button
            onClick={async () => {
              const { createClient } = await import("@/lib/supabase/client");
              await createClient().auth.signOut();
              document.documentElement.removeAttribute("data-theme");
              router.push("/login");
            }}
            style={{
              fontSize: "12px",
              color: "var(--muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "Metropolis, sans-serif",
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Profile header */}
      <EditProfile
        profile={profile}
        onSave={(updated) =>
          setProfile((prev) => (prev ? { ...prev, ...updated } : prev))
        }
        links={links}
      />

      {/* Links section */}
      <div style={{ padding: "24px 24px 0" }}>
        <div style={sectionLabel}>Links</div>

        {loading ? (
          <p style={{ fontSize: "13px", color: "var(--muted)" }}>Loading...</p>
        ) : (
          <>
            <LinkList
              links={links}
              onUpdate={updateLink}
              onDelete={deleteLink}
              onReorder={reorderLinks}
            />
            {links.length === 0 && !adding && (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--muted)",
                  marginBottom: "12px",
                  fontStyle: "italic",
                }}
              >
                your links live here. add one to get started. ↓
              </p>
            )}
          </>
        )}

        {adding ? (
          <div style={{ marginTop: "8px" }}>
            <input
              style={formInputStyle}
              type="text"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
            <input
              style={formInputStyle}
              type="url"
              placeholder="https://"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleAddLink}
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
                Add
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setNewTitle("");
                  setNewUrl("");
                }}
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
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => setAdding(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "13px 14px",
                background: "none",
                border: "1px dashed var(--divider)",
                borderRadius: "6px",
                fontSize: "13px",
                fontFamily: "Metropolis, sans-serif",
                color: "var(--muted)",
                cursor: "pointer",
                marginTop: "4px",
              }}
            >
              <span style={{ fontSize: "16px", fontWeight: 300 }}>+</span> Add link
            </button>
            <button
              onClick={async () => {
                setSectionError("");
                const { error } = await addSection();
                if (error) setSectionError("couldn't add section — try again");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                fontSize: "12px",
                fontFamily: "Metropolis, sans-serif",
                color: "var(--muted)",
                cursor: "pointer",
                padding: "8px 2px 0",
              }}
            >
              + Add section
            </button>
            {sectionError && (
              <p style={{ fontSize: "11px", color: "var(--error)", margin: "4px 0 0" }}>
                {sectionError}
              </p>
            )}
          </>
        )}
      </div>

      <div style={divider} />

      {/* Appearance section */}
      <div style={{ padding: "24px 24px 0" }}>
        <div style={sectionLabel}>Theme</div>
        <AppearancePicker current={theme} onChange={handleThemeChange} />
      </div>

      <div style={divider} />

      {/* Account section */}
      <AccountSection
        profile={profile}
        onUsernameChange={(username) =>
          setProfile((prev) => (prev ? { ...prev, username } : prev))
        }
        showSocialIcons={showSocialIcons}
        onToggleSocialIcons={handleToggleSocialIcons}
      />
    </main>
  );
}

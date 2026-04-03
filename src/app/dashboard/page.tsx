"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLinks } from "@/hooks/useLinks";
import LinkList from "@/components/dashboard/LinkList";
import AppearancePicker from "@/components/dashboard/AppearancePicker";
import EditProfile from "@/components/dashboard/EditProfile";
import { useRouter } from "next/navigation";
import type { Profile, Theme } from "@/types";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const { links, loading, addLink, updateLink, deleteLink, reorderLinks } =
    useLinks(profile?.id ?? "");

  // fetch profile
  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setTheme((data.theme as Theme) ?? "light");
        document.documentElement.setAttribute(
          "data-theme",
          data.theme === "light" ? "" : data.theme,
        );
      }
    }
    fetchProfile();
  }, []);

  async function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);
    document.documentElement.setAttribute(
      "data-theme",
      newTheme === "light" ? "" : newTheme,
    );
    if (profile) {
      await supabase
        .from("profiles")
        .update({ theme: newTheme })
        .eq("id", profile.id);
    }
  }

  async function handleAddLink() {
    if (!newTitle.trim() || !newUrl.trim()) return;
    await addLink(newTitle.trim(), newUrl.trim());
    setNewTitle("");
    setNewUrl("");
    setAdding(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!profile) return null;

  const sectionLabel: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: "12px",
  };

  const divider: React.CSSProperties = {
    height: "1px",
    backgroundColor: "var(--divider)",
    margin: "24px 24px 0",
  };

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
    marginBottom: "8px",
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
            onClick={handleSignOut}
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "24px 24px 20px",
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            backgroundColor: "var(--divider)",
            backgroundImage: profile.avatar_url
              ? `url(${profile.avatar_url})`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--muted)",
            flexShrink: 0,
          }}
        >
          {!profile.avatar_url &&
            (profile.display_name ?? profile.username).charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontSize: "15px", fontWeight: 600, marginBottom: "2px" }}
          >
            {profile.display_name ?? profile.username}
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
            {profile.bio ?? "No bio yet"}
          </div>
        </div>
        <button
          onClick={() => setEditingProfile((e) => !e)}
          style={{
            fontSize: "12px",
            color: "var(--muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "Metropolis, sans-serif",
          }}
        >
          {editingProfile ? "Close" : "Edit →"}
        </button>
      </div>

      {editingProfile && (
        <EditProfile
          profile={profile}
          onSave={(updated) => {
            setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
            setEditingProfile(false);
          }}
          onCancel={() => setEditingProfile(false)}
        />
      )}

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

        {/* Add link form */}
        {adding ? (
          <div style={{ marginTop: "8px" }}>
            <input
              style={inputStyle}
              type="text"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
            <input
              style={inputStyle}
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
                  backgroundColor: "none",
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
            <span style={{ fontSize: "16px", fontWeight: 300 }}>+</span> Add
            link
          </button>
        )}
      </div>

      <div style={divider} />

      {/* Appearance section */}
      <div style={{ padding: "24px 24px 0" }}>
        <div style={sectionLabel}>Appearance</div>
        <AppearancePicker current={theme} onChange={handleThemeChange} />
      </div>
    </main>
  );
}

"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLinks } from "@/hooks/useLinks";
import LinkList from "@/components/dashboard/LinkList";
import AppearancePicker from "@/components/dashboard/AppearancePicker";
import EditProfile from "@/components/dashboard/EditProfile";
import { useRouter } from "next/navigation";
import type { Profile, Theme } from "@/types";
import { inputStyle, sectionLabelStyle } from "@/styles/shared";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const [theme, setTheme] = useState<Theme>("default");
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [username, setUsername] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [unSaved, setUnSaved] = useState(false);
  const [unError, setUnError] = useState("");
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unEmptyWarned = useRef(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const { links, loading, addLink, updateLink, deleteLink, reorderLinks } =
    useLinks(profile?.id ?? "");

  useEffect(() => {
    const timer = setTimeout(() => setShowSpinner(true), 200);
    return () => clearTimeout(timer);
  }, []);

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
        setTheme((data.theme as Theme) ?? "default");
        document.documentElement.setAttribute(
          "data-theme",
          data.theme === "default" ? "" : data.theme,
        );
      }
    }
    fetchProfile();
  }, []);

  async function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);
    document.documentElement.setAttribute(
      "data-theme",
      newTheme === "default" ? "" : newTheme,
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

  async function saveUsername() {
    if (!username.trim()) {
      if (unEmptyWarned.current) {
        // Second blur with empty value — cancel edit and revert
        setUsername(profile!.username);
        setUnError("");
        setEditingUsername(false);
        unEmptyWarned.current = false;
      } else {
        setUnError("username can't be empty");
        unEmptyWarned.current = true;
      }
      return;
    }
    setUnError("");
    unEmptyWarned.current = false;
    const { error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", profile!.id);
    if (error) {
      setUnError(error.code === "23505" ? "that username is already taken" : error.message);
    } else {
      setEditingUsername(false);
      setProfile((prev) => (prev ? { ...prev, username } : prev));
      setUnSaved(true);
      if (unSavedTimer.current) clearTimeout(unSavedTimer.current);
      unSavedTimer.current = setTimeout(() => setUnSaved(false), 2000);
    }
  }

  if (!profile) {
    if (!showSpinner) return null;
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "2px solid var(--divider)",
              borderTopColor: "var(--accent)",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            Loading…
          </span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  const sectionLabel = { ...sectionLabelStyle, marginBottom: "12px" } as React.CSSProperties;

  const divider: React.CSSProperties = {
    height: "1px",
    backgroundColor: "var(--divider)",
    margin: "24px 24px 0",
  };

  const formInputStyle = { ...inputStyle, backgroundColor: "var(--surface)", marginBottom: "8px" } as React.CSSProperties;

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
      <EditProfile
        profile={profile}
        onSave={(updated) =>
          setProfile((prev) => (prev ? { ...prev, ...updated } : prev))
        }
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

        {/* Add link form */}
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
        <div style={sectionLabel}>Theme</div>
        <AppearancePicker current={theme} onChange={handleThemeChange} />
      </div>

      <div style={divider} />

      {/* Account section */}
      <div style={{ padding: "24px 24px 0" }}>
        <div style={sectionLabel}>Account</div>
        <div style={{ marginBottom: "4px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--muted)" }}>
          Username
          <span
            style={{
              marginLeft: "8px",
              fontWeight: 400,
              letterSpacing: 0,
              textTransform: "none",
              opacity: unSaved ? 1 : 0,
              transition: "opacity 0.5s",
              color: "var(--accent)",
            }}
          >
            updated — your public URL has changed ✓
          </span>
        </div>
        {editingUsername ? (
          <input
            autoFocus
            style={{
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
            }}
            type="text"
            value={username}
            onChange={(e) => {
              unEmptyWarned.current = false;
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
            }}
            onBlur={saveUsername}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.target as HTMLInputElement).blur()
            }
            placeholder="username"
          />
        ) : (
          <div
            onClick={() => { setEditingUsername(true); setUsername(profile.username); }}
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
          onClick={() => {
            const url = `${(process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "")}/${profile.username}`;
            navigator.clipboard.writeText(url).then(() => {
              setCopied(true);
              if (copiedTimer.current) clearTimeout(copiedTimer.current);
              copiedTimer.current = setTimeout(() => setCopied(false), 2000);
            }).catch(() => {});
          }}
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
        {unError && (
          <p style={{ fontSize: "11px", color: "var(--error)", marginTop: "4px" }}>
            {unError}
          </p>
        )}
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchProfileByUserId } from "@/lib/db/profiles";
import { insertProfileForNewUser } from "@/lib/create-initial-profile";

export default function OnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUsernameChange = useCallback((raw: string) => {
    setUsername(raw.toLowerCase().replace(/[^a-z0-9]/g, ""));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function run() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        const profile = await fetchProfileByUserId(supabase, user.id);
        if (cancelled) return;
        if (profile) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        if (!cancelled) setError("couldn't load your account — try again");
      }
      if (!cancelled) setReady(true);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const result = await insertProfileForNewUser(supabase, {
        userId: user.id,
        username,
        email: user.email,
      });

      if (result.ok) {
        router.replace("/dashboard");
        return;
      }

      switch (result.error) {
        case "invalid":
          setError("choose a username");
          break;
        case "reserved":
          setError("that username is reserved");
          break;
        case "taken":
          setError("that username is already taken");
          break;
        default:
          setError("couldn't create your profile — try again");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
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
        {error ? (
          <p style={{ fontSize: "13px", color: "var(--error)", textAlign: "center" }}>
            {error}
          </p>
        ) : (
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
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>Loading…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        backgroundColor: "var(--bg)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 600,
            letterSpacing: "-0.5px",
            marginBottom: "8px",
            color: "var(--text)",
          }}
        >
          Choose your username
        </h1>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--muted)",
            marginBottom: "24px",
            lineHeight: 1.6,
          }}
        >
          This becomes your public profile URL:{" "}
          <span style={{ color: "var(--text)" }}>/</span>
          <span style={{ color: "var(--accent)" }}>yourname</span>
          . Use letters and numbers; it will be lowercased automatically.
        </p>

        <label
          htmlFor="onboarding-username"
          style={{
            display: "block",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: "8px",
          }}
        >
          Username
        </label>
        <input
          id="onboarding-username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) void handleSubmit();
          }}
          disabled={loading}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "onboarding-username-error" : undefined}
          style={{
            width: "100%",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--divider)",
            borderRadius: "4px",
            padding: "10px 14px",
            fontSize: "14px",
            fontFamily: "Metropolis, sans-serif",
            color: "var(--text)",
            outline: "none",
            marginBottom: "12px",
            opacity: loading ? 0.6 : 1,
            boxSizing: "border-box",
          }}
        />

        {error && (
          <p
            id="onboarding-username-error"
            style={{
              fontSize: "12px",
              color: "var(--error)",
              marginBottom: "12px",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={loading || !username.trim()}
          aria-busy={loading}
          style={{
            width: "100%",
            backgroundColor: "var(--accent)",
            color: "var(--bg)",
            border: "none",
            borderRadius: "4px",
            padding: "11px",
            fontSize: "14px",
            fontWeight: 500,
            fontFamily: "Metropolis, sans-serif",
            cursor: loading || !username.trim() ? "not-allowed" : "pointer",
            opacity: loading || !username.trim() ? 0.6 : 1,
          }}
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </div>
    </main>
  );
}

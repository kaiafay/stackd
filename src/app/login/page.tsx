"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
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
            fontSize: "20px",
            fontWeight: 600,
            letterSpacing: "-0.3px",
            marginBottom: "8px",
            color: "var(--text)",
          }}
        >
          stackd
        </h1>

        {!submitted ? (
          <>
            <p
              style={{
                fontSize: "13px",
                color: "var(--muted)",
                marginBottom: "32px",
              }}
            >
              Enter your email to sign in or create an account.
            </p>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
              }}
            />

            {error && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#C0735A",
                  marginBottom: "12px",
                }}
              >
                {error}
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !email}
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
                cursor: loading || !email ? "not-allowed" : "pointer",
                opacity: loading || !email ? 0.6 : 1,
              }}
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </>
        ) : (
          <p
            style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}
          >
            Check your email — we sent a magic link to{" "}
            <span style={{ color: "var(--text)", fontWeight: 500 }}>
              {email}
            </span>
            .
          </p>
        )}
      </div>
    </main>
  );
}

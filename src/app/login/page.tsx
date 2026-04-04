"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const URL_ERROR_MESSAGES: Record<string, string> = {
  profile_creation_failed: "We had trouble setting up your account. Please try signing in again.",
  auth: "Something went wrong signing you in. Please try again.",
};

function LoginErrorMessage() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  if (!urlError) return null;
  const message = URL_ERROR_MESSAGES[urlError] ?? "Something went wrong. Please try again.";
  return (
    <p
      style={{
        fontSize: "13px",
        color: "var(--error)",
        marginTop: "16px",
        lineHeight: 1.5,
      }}
    >
      {message}
    </p>
  );
}

const TITLE = "stackd";
const CHAR_DELAY = 80;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedText(TITLE);
      setCursorVisible(false);
      return;
    }

    let i = 0;
    let mounted = true;

    const type = () => {
      if (!mounted) return;
      if (i < TITLE.length) {
        setTypedText(TITLE.slice(0, i + 1));
        i++;
        timeoutRef.current = setTimeout(type, CHAR_DELAY);
      } else {
        let blinks = 0;
        intervalRef.current = setInterval(() => {
          if (!mounted) return;
          setCursorVisible((v) => !v);
          blinks++;
          if (blinks >= 5) {
            clearInterval(intervalRef.current!);
            setCursorVisible(false);
          }
        }, 350);
      }
    };

    timeoutRef.current = setTimeout(type, 200);

    return () => {
      mounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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
            fontSize: "32px",
            fontWeight: 600,
            letterSpacing: "-0.5px",
            marginBottom: "8px",
            color: "var(--text)",
          }}
        >
          {typedText}
          <span
            style={{
              display: "inline-block",
              width: "2px",
              height: "0.85em",
              backgroundColor: "var(--accent)",
              marginLeft: "2px",
              verticalAlign: "middle",
              opacity: cursorVisible ? 1 : 0,
            }}
          />
        </h1>

        <p
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--muted)",
            marginBottom: "28px",
            letterSpacing: "0.1px",
          }}
        >
          one page. every link.
        </p>

        {!submitted ? (
          <>
            <p
              style={{
                fontSize: "13px",
                color: "var(--muted)",
                marginBottom: "16px",
                lineHeight: 1.6,
              }}
            >
              Create a free profile with all your links and share it anywhere.
              Enter your email to get started.
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
                  color: "var(--error)",
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

            <Suspense fallback={null}>
              <LoginErrorMessage />
            </Suspense>
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

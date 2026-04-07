"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getBrowserSiteOrigin } from "@/lib/site-url";

const URL_ERROR_MESSAGES: Record<string, string> = {
  profile_creation_failed: "We had trouble setting up your account. Please try signing in again.",
  auth: "Something went wrong signing you in. Please try again.",
  oauth: "Sign-in was cancelled or failed. Please try again.",
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
  const [googleLoading, setGoogleLoading] = useState(false);
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

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getBrowserSiteOrigin()}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleLogin() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${getBrowserSiteOrigin()}/auth/callback`,
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

  const oauthBusy = googleLoading;
  const otpBusy = loading;

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
              Sign in with Google or enter your email for a magic link.
            </p>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={oauthBusy || otpBusy}
              aria-busy={oauthBusy}
              aria-disabled={oauthBusy || otpBusy}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                backgroundColor: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--divider)",
                borderRadius: "4px",
                padding: "11px 14px",
                fontSize: "14px",
                fontWeight: 500,
                fontFamily: "Metropolis, sans-serif",
                cursor: oauthBusy || otpBusy ? "not-allowed" : "pointer",
                opacity: oauthBusy || otpBusy ? 0.6 : 1,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden
                focusable="false"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {oauthBusy ? "Redirecting…" : "Continue with Google"}
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                margin: "20px 0",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  backgroundColor: "var(--divider)",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--muted)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                or
              </span>
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  backgroundColor: "var(--divider)",
                }}
              />
            </div>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !oauthBusy && !otpBusy && handleLogin()
              }
              disabled={oauthBusy}
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
                opacity: oauthBusy ? 0.6 : 1,
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
              type="button"
              onClick={handleLogin}
              disabled={otpBusy || oauthBusy || !email}
              aria-busy={otpBusy}
              aria-disabled={otpBusy || oauthBusy || !email}
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
                cursor: otpBusy || oauthBusy || !email ? "not-allowed" : "pointer",
                opacity: otpBusy || oauthBusy || !email ? 0.6 : 1,
              }}
            >
              {otpBusy ? "Sending..." : "Send magic link"}
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

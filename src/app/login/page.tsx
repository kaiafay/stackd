"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getBrowserSiteOrigin } from "@/lib/site-url";

const MIN_PASSWORD_LENGTH = 8;

const URL_ERROR_MESSAGES: Record<string, string> = {
  profile_creation_failed: "We had trouble setting up your account. Please try signing in again.",
  auth: "Something went wrong signing you in. Please try again.",
  oauth: "Sign-in was cancelled or failed. Please try again.",
};

/** Friendly copy for common Supabase Auth error strings (substring match). */
function mapAuthErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "Invalid email or password. Try again or use a magic link.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirm your email before signing in, or use the link we sent you.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (m.includes("password") && (m.includes("at least") || m.includes("least"))) {
    return "Password does not meet the minimum length or strength.";
  }
  if (m.includes("weak") && m.includes("password")) {
    return "Password is too weak. Try a longer, more varied password.";
  }
  return message;
}

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

type AuthTab = "sign-in" | "sign-up";
type SignInMethod = "password" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authTab, setAuthTab] = useState<AuthTab>("sign-in");
  const [signInMethod, setSignInMethod] = useState<SignInMethod>("password");
  const [submitted, setSubmitted] = useState(false);
  const [signUpEmailSent, setSignUpEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
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

  async function handleMagicLink() {
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
      setError(mapAuthErrorMessage(error.message));
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  }

  async function handlePasswordSignIn() {
    setPasswordLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(mapAuthErrorMessage(error.message));
      setPasswordLoading(false);
      return;
    }
    router.replace("/dashboard");
  }

  async function handleSignUp() {
    setPasswordLoading(true);
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setPasswordLoading(false);
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      setPasswordLoading(false);
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getBrowserSiteOrigin()}/auth/callback`,
      },
    });
    if (error) {
      setError(mapAuthErrorMessage(error.message));
      setPasswordLoading(false);
      return;
    }
    if (data.session) {
      router.replace("/onboarding");
      return;
    }
    setSignUpEmailSent(true);
    setPasswordLoading(false);
  }

  const oauthBusy = googleLoading;
  const otpBusy = loading;
  const pwBusy = passwordLoading;
  const formBusy = oauthBusy || otpBusy || pwBusy;

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

        {submitted ? (
          <p
            style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}
          >
            Check your email — we sent a magic link to{" "}
            <span style={{ color: "var(--text)", fontWeight: 500 }}>
              {email}
            </span>
            .
          </p>
        ) : signUpEmailSent ? (
          <p
            style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}
          >
            Check your email — we sent a confirmation link to{" "}
            <span style={{ color: "var(--text)", fontWeight: 500 }}>
              {email}
            </span>
            . After you confirm, you can sign in here.
          </p>
        ) : (
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
              Sign in with Google, email and password, or a magic link.
            </p>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={formBusy}
              aria-busy={oauthBusy}
              aria-disabled={formBusy}
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
                cursor: formBusy ? "not-allowed" : "pointer",
                opacity: formBusy ? 0.6 : 1,
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

            <div
              role="tablist"
              aria-label="Sign in or sign up"
              style={{
                display: "flex",
                marginBottom: "16px",
                border: "1px solid var(--divider)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={authTab === "sign-in"}
                id="tab-sign-in"
                aria-controls="auth-panel"
                onClick={() => {
                  setAuthTab("sign-in");
                  setError("");
                }}
                disabled={formBusy}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  fontSize: "14px",
                  fontWeight: authTab === "sign-in" ? 600 : 500,
                  fontFamily: "Metropolis, sans-serif",
                  border: "none",
                  borderRight: "1px solid var(--divider)",
                  cursor: formBusy ? "not-allowed" : "pointer",
                  backgroundColor:
                    authTab === "sign-in" ? "var(--surface)" : "var(--bg)",
                  color: "var(--text)",
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authTab === "sign-up"}
                id="tab-sign-up"
                aria-controls="auth-panel"
                onClick={() => {
                  setAuthTab("sign-up");
                  setError("");
                  setConfirmPassword("");
                }}
                disabled={formBusy}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  fontSize: "14px",
                  fontWeight: authTab === "sign-up" ? 600 : 500,
                  fontFamily: "Metropolis, sans-serif",
                  border: "none",
                  cursor: formBusy ? "not-allowed" : "pointer",
                  backgroundColor:
                    authTab === "sign-up" ? "var(--surface)" : "var(--bg)",
                  color: "var(--text)",
                }}
              >
                Sign up
              </button>
            </div>

            <div id="auth-panel" role="tabpanel" aria-labelledby={authTab === "sign-in" ? "tab-sign-in" : "tab-sign-up"}>
              {authTab === "sign-in" && signInMethod === "password" ? (
                <>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !formBusy && email && password) {
                        e.preventDefault();
                        void handlePasswordSignIn();
                      }
                    }}
                    disabled={formBusy}
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
                      opacity: formBusy ? 0.6 : 1,
                    }}
                  />
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !formBusy && email && password) {
                        e.preventDefault();
                        void handlePasswordSignIn();
                      }
                    }}
                    disabled={formBusy}
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
                      marginBottom: "10px",
                      opacity: formBusy ? 0.6 : 1,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSignInMethod("magic");
                      setError("");
                    }}
                    disabled={formBusy}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      marginBottom: "12px",
                      fontSize: "12px",
                      fontFamily: "Metropolis, sans-serif",
                      color: "var(--accent)",
                      cursor: formBusy ? "not-allowed" : "pointer",
                      textDecoration: "underline",
                      textUnderlineOffset: "2px",
                    }}
                  >
                    Email me a magic link instead
                  </button>
                </>
              ) : authTab === "sign-in" && signInMethod === "magic" ? (
                <>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !formBusy && email && !otpBusy) {
                        e.preventDefault();
                        void handleMagicLink();
                      }
                    }}
                    disabled={formBusy}
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
                      marginBottom: "10px",
                      opacity: formBusy ? 0.6 : 1,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSignInMethod("password");
                      setError("");
                    }}
                    disabled={formBusy}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      marginBottom: "12px",
                      fontSize: "12px",
                      fontFamily: "Metropolis, sans-serif",
                      color: "var(--accent)",
                      cursor: formBusy ? "not-allowed" : "pointer",
                      textDecoration: "underline",
                      textUnderlineOffset: "2px",
                    }}
                  >
                    Sign in with password
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={formBusy}
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
                      opacity: formBusy ? 0.6 : 1,
                    }}
                  />
                  <input
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
                    placeholder={`Password (at least ${MIN_PASSWORD_LENGTH} characters)`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={formBusy}
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
                      opacity: formBusy ? 0.6 : 1,
                    }}
                  />
                  <input
                    type="password"
                    name="confirm-password"
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !formBusy &&
                        email &&
                        password &&
                        confirmPassword
                      ) {
                        e.preventDefault();
                        void handleSignUp();
                      }
                    }}
                    disabled={formBusy}
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
                      opacity: formBusy ? 0.6 : 1,
                    }}
                  />
                </>
              )}
            </div>

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

            {authTab === "sign-in" && signInMethod === "password" ? (
              <button
                type="button"
                onClick={() => void handlePasswordSignIn()}
                disabled={pwBusy || oauthBusy || otpBusy || !email || !password}
                aria-busy={pwBusy}
                aria-disabled={pwBusy || oauthBusy || otpBusy || !email || !password}
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
                  cursor:
                    pwBusy || oauthBusy || otpBusy || !email || !password
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    pwBusy || oauthBusy || otpBusy || !email || !password ? 0.6 : 1,
                }}
              >
                {pwBusy ? "Signing in…" : "Sign in"}
              </button>
            ) : authTab === "sign-in" && signInMethod === "magic" ? (
              <button
                type="button"
                onClick={() => void handleMagicLink()}
                disabled={otpBusy || oauthBusy || pwBusy || !email}
                aria-busy={otpBusy}
                aria-disabled={otpBusy || oauthBusy || pwBusy || !email}
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
                  cursor:
                    otpBusy || oauthBusy || pwBusy || !email
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    otpBusy || oauthBusy || pwBusy || !email ? 0.6 : 1,
                }}
              >
                {otpBusy ? "Sending…" : "Send magic link"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSignUp()}
                disabled={
                  pwBusy ||
                  oauthBusy ||
                  otpBusy ||
                  !email ||
                  !password ||
                  !confirmPassword
                }
                aria-busy={pwBusy}
                aria-disabled={
                  pwBusy ||
                  oauthBusy ||
                  otpBusy ||
                  !email ||
                  !password ||
                  !confirmPassword
                }
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
                  cursor:
                    pwBusy ||
                    oauthBusy ||
                    otpBusy ||
                    !email ||
                    !password ||
                    !confirmPassword
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    pwBusy ||
                    oauthBusy ||
                    otpBusy ||
                    !email ||
                    !password ||
                    !confirmPassword
                      ? 0.6
                      : 1,
                }}
              >
                {pwBusy ? "Creating account…" : "Create account"}
              </button>
            )}

            <Suspense fallback={null}>
              <LoginErrorMessage />
            </Suspense>
          </>
        )}
      </div>
    </main>
  );
}

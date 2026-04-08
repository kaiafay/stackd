"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./landing-page.module.css";

const TITLE = "stackd";
const CHAR_DELAY = 80;

type ThemeKey = "default" | "retro" | "noir" | "soft" | "terminal";

const THEMES: Record<
  ThemeKey,
  {
    bg: string;
    text: string;
    divider: string;
    accent: string;
    muted: string;
    fontFamily: string;
  }
> = {
  default: {
    bg: "#f7f4ef",
    text: "#1a1714",
    divider: "#e8e3da",
    accent: "#8b7355",
    muted: "#a09880",
    fontFamily: "Metropolis, sans-serif",
  },
  retro: {
    bg: "#f2e8d9",
    text: "#2c1a0e",
    divider: "#ddd0bb",
    accent: "#c4541a",
    muted: "#9e8572",
    fontFamily: "'Playfair Display', serif",
  },
  noir: {
    bg: "#111111",
    text: "#f0f0f0",
    divider: "#2a2a2a",
    accent: "#888888",
    muted: "#555555",
    fontFamily: "Oswald, sans-serif",
  },
  soft: {
    bg: "#f5eef0",
    text: "#2d2028",
    divider: "#e4d5d9",
    accent: "#b07a8a",
    muted: "#a8909a",
    fontFamily: "'Petit Formal Script', cursive",
  },
  terminal: {
    bg: "#0d0d0d",
    text: "#e8e8e8",
    divider: "#1e1e1e",
    accent: "#ffb000",
    muted: "#666666",
    fontFamily: "'Fira Code', monospace",
  },
};

const MOCK_LINKS = [
  { id: "1", title: "Portfolio" },
  { id: "2", title: "Newsletter" },
  { id: "3", title: "Instagram" },
];

const FAQ_ITEMS = [
  {
    q: "Who is this for?",
    a: "Creators, freelancers, developers, and anyone who shares more than one link. If you've ever crammed five URLs into a bio, this is for you.",
  },
  {
    q: "How is this different from other link-in-bio tools?",
    a: "No paywalled themes, no upsell prompts, no feature tiers. Sign up, pick a username, choose a look, add links. That's it.",
  },
  {
    q: "Is it free?",
    a: "Yes. No credit card, no trial period.",
  },
  {
    q: "Who built this?",
    a: "A solo project by Kaia. Because every link-in-bio tool looks identical — and I wanted something minimal, editorial, and actually personal.",
  },
];

export default function LandingPage() {
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("default");
  const [displayedTheme, setDisplayedTheme] = useState<ThemeKey>("default");
  const [previewAnim, setPreviewAnim] = useState<"idle" | "exiting" | "entering">("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  function handleThemeChange(key: ThemeKey) {
    if (key === activeTheme) return;
    setActiveTheme(key);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayedTheme(key);
      return;
    }

    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setPreviewAnim("exiting");
    animTimerRef.current = setTimeout(() => {
      setDisplayedTheme(key);
      setPreviewAnim("entering");
      animTimerRef.current = setTimeout(() => {
        setPreviewAnim("idle");
      }, 180);
    }, 150);
  }

  const theme = THEMES[displayedTheme];

  return (
    // No horizontal padding on <main> — footer border must span the full viewport
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Constrained content wrapper — carries the horizontal padding */}
      <div className={styles.contentWrap}>
        {/* Hero section — fills the viewport so content reads as "above the fold" */}
        <section className={styles.hero}>
          {/* Left: hero text + CTAs */}
          <div className={styles.heroTextCol}>
            <h1 aria-label={TITLE} className={styles.heroTitle}>
              {/* Invisible spacer — keeps h1 the right height; aria-label above covers a11y */}
              <span aria-hidden="true" style={{ visibility: "hidden" }}>
                {TITLE}
              </span>
              {/* Decorative animated overlay — never read by screen readers */}
              <span
                aria-hidden="true"
                style={{ position: "absolute", inset: 0 }}
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
              </span>
            </h1>

            <p className={styles.heroTagline}>one page. every link.</p>

            <p className={styles.heroBody}>
              Pick a username, add your links,
              <br />
              and share everything from one place.
            </p>

            <div className={styles.heroCtas}>
              <Link
                href="/login?tab=sign-up"
                style={{
                  display: "block",
                  textAlign: "center",
                  backgroundColor: "var(--accent)",
                  color: "var(--bg)",
                  borderRadius: "4px",
                  padding: "13px 20px",
                  fontSize: "14px",
                  fontWeight: 500,
                  fontFamily: "Metropolis, sans-serif",
                  textDecoration: "none",
                }}
              >
                Create your page
              </Link>
              <Link
                href="/login"
                style={{
                  display: "block",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "var(--muted)",
                  textDecoration: "none",
                }}
              >
                Already have an account? Sign in →
              </Link>
            </div>
          </div>

          {/* Right: profile mock + theme switcher */}
          <div className={styles.heroPreviewCol}>
            <div
              className={
                previewAnim === "exiting"
                  ? styles.previewExiting
                  : previewAnim === "entering"
                    ? styles.previewEntering
                    : undefined
              }
              style={{
                backgroundColor: theme.bg,
                border: `1px solid ${theme.divider}`,
                borderRadius: "8px",
                padding: "44px 32px 36px",
                fontFamily: theme.fontFamily,
                marginBottom: "16px",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  backgroundColor: theme.divider,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 600,
                  color: theme.muted,
                  margin: "0 auto 14px",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                K
              </div>

              {/* Name */}
              <p
                style={{
                  textAlign: "center",
                  fontSize: "20px",
                  fontWeight: 600,
                  letterSpacing: "-0.3px",
                  lineHeight: 1.2,
                  color: theme.text,
                  marginBottom: "6px",
                }}
              >
                Kaia
              </p>

              {/* Bio */}
              <p
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                  color: theme.muted,
                  lineHeight: 1.5,
                  marginBottom: "28px",
                }}
              >
                designer & creator
              </p>

              {/* Links — matches /[username]/page.tsx structure */}
              <div style={{ display: "flex" }}>
                <div
                  style={{
                    width: "2px",
                    backgroundColor: theme.accent,
                    alignSelf: "stretch",
                    marginTop: "15px",
                    marginBottom: "15px",
                    flexShrink: 0,
                  }}
                />
                <ul
                  style={{
                    flex: 1,
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    minWidth: 0,
                  }}
                >
                  {MOCK_LINKS.map((link) => (
                    <li key={link.id}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "15px 0 15px 14px",
                          color: theme.text,
                        }}
                      >
                        <span style={{ fontSize: "13px", fontWeight: 500, lineHeight: 1 }}>
                          {link.title}
                        </span>
                        <span style={{ fontSize: "13px", color: theme.accent, lineHeight: 1 }}>
                          →
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Profile footer */}
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <span
                  style={{
                    fontSize: "10px",
                    lineHeight: 1,
                    color: theme.muted,
                    letterSpacing: "0.5px",
                    textDecoration: "underline",
                    textDecorationColor: theme.divider,
                    textUnderlineOffset: "3px",
                  }}
                >
                  made with stackd
                </span>
              </div>
            </div>

            {/* Theme switcher */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "16px",
              }}
            >
              {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "4px 0",
                    fontSize: "12px",
                    fontFamily: "Metropolis, sans-serif",
                    color: activeTheme === key ? "var(--text)" : "var(--muted)",
                    fontWeight: activeTheme === key ? 600 : 400,
                    cursor: "pointer",
                    borderBottom:
                      activeTheme === key
                        ? "1px solid var(--text)"
                        : "1px solid transparent",
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ section */}
        <section className={styles.faqSection}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            FAQ
          </p>

          <div>
            {FAQ_ITEMS.map(({ q, a }, i) => (
              <div
                key={q}
                style={{
                  borderTop: "1px solid var(--divider)",
                  ...(i === FAQ_ITEMS.length - 1
                    ? { borderBottom: "1px solid var(--divider)" }
                    : {}),
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 0",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: "16px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--text)",
                      fontFamily: "Metropolis, sans-serif",
                    }}
                  >
                    {q}
                  </span>
                  <span
                    style={{
                      fontSize: "18px",
                      color: "var(--muted)",
                      flexShrink: 0,
                      fontFamily: "Metropolis, sans-serif",
                      lineHeight: 1,
                    }}
                  >
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>

                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: openFaq === i ? "1fr" : "0fr",
                    transition: "grid-template-rows 0.25s ease",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ minHeight: 0 }}>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "var(--muted)",
                        lineHeight: 1.6,
                        paddingBottom: "16px",
                        margin: 0,
                      }}
                    >
                      {a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer — direct child of <main> with no horizontal padding, so border is truly full-width */}
      <footer
        style={{
          width: "100%",
          borderTop: "1px solid var(--divider)",
          paddingTop: "16px",
          paddingBottom: "16px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <p style={{ fontSize: "12px", color: "var(--muted)" }}>
          built by{" "}
          <a
            href="https://kaiafay.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--text)",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
            }}
          >
            kaia
          </a>
        </p>
      </footer>
    </main>
  );
}

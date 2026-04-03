"use client";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          textAlign: "center",
          maxWidth: "320px",
        }}
      >
        <p style={{ fontSize: "14px", color: "var(--text)" }}>
          Something went wrong loading this profile.
        </p>
        <button
          onClick={reset}
          style={{
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "Metropolis, sans-serif",
            backgroundColor: "var(--accent)",
            color: "var(--bg)",
            border: "none",
            borderRadius: "4px",
            padding: "8px 20px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    </main>
  );
}

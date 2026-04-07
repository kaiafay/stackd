"use client";

export default function ProfileShareButton({
  shareUrl,
  displayName,
}: {
  shareUrl: string;
  displayName: string;
}) {
  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on Stackd`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Share unavailable or failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Clipboard not available (non-secure context, etc.) — prompt as last resort
      window.prompt("Copy your profile link:", shareUrl);
    }
  }

  return (
    <button
      type="button"
      aria-label="Share profile"
      onClick={handleShare}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        background: "none",
        border: "1px solid var(--divider)",
        borderRadius: "20px",
        padding: "5px 14px",
        fontSize: "12px",
        color: "var(--muted)",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      Share
    </button>
  );
}

import { detectPlatform } from "@/lib/detectPlatform";
import type { Link } from "@/types";

type Props = {
  links: Link[];
  interactive?: boolean;
  /** Extra styles applied to the outer wrapper div (only rendered when icons are present). */
  style?: React.CSSProperties;
};

export default function SocialIconRow({ links, interactive = true, style }: Props) {
  // Collect first match per platform (by title) in link order.
  const seen = new Set<string>();
  const matches: { url: string; title: string; path: string }[] = [];

  for (const link of links) {
    if (link.kind !== "link" || !link.url || !link.enabled) continue;
    const icon = detectPlatform(link.url);
    if (!icon || seen.has(icon.title)) continue;
    seen.add(icon.title);
    matches.push({ url: link.url, title: icon.title, path: icon.path });
  }

  if (matches.length === 0) return null;

  const iconSvg = (path: string, title: string) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      role="img"
    >
      <title>{title}</title>
      <path d={path} />
    </svg>
  );

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
        alignItems: "center",
        ...style,
      }}
    >
      {matches.map(({ url, title, path }) =>
        interactive ? (
          <a
            key={title}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={title}
            style={{
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            {iconSvg(path, title)}
          </a>
        ) : (
          <span
            key={title}
            aria-label={title}
            style={{ color: "var(--muted)", display: "flex", alignItems: "center" }}
          >
            {iconSvg(path, title)}
          </span>
        )
      )}
    </div>
  );
}

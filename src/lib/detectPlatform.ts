import { siInstagram, siTiktok, siX, siYoutube, siSpotify, siGithub } from "simple-icons";

// LinkedIn was removed from simple-icons; use the official brand SVG path directly.
const LINKEDIN_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";

export type PlatformIcon = {
  title: string;
  path: string;
};

// Keyed by root domain; subdomain variants (m., mobile., music., etc.) match via endsWith check.
const PLATFORM_MAP: [string, PlatformIcon][] = [
  ["instagram.com", { title: "Instagram", path: siInstagram.path }],
  ["tiktok.com",    { title: "TikTok",    path: siTiktok.path }],
  ["x.com",         { title: "X",         path: siX.path }],
  ["twitter.com",   { title: "X",         path: siX.path }],
  ["youtube.com",   { title: "YouTube",   path: siYoutube.path }],
  ["youtu.be",      { title: "YouTube",   path: siYoutube.path }],
  ["spotify.com",   { title: "Spotify",   path: siSpotify.path }],
  ["github.com",    { title: "GitHub",    path: siGithub.path }],
  ["linkedin.com",  { title: "LinkedIn",  path: LINKEDIN_PATH }],
];

export function detectPlatform(url: string): PlatformIcon | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    for (const [domain, icon] of PLATFORM_MAP) {
      if (hostname === domain || hostname.endsWith("." + domain)) return icon;
    }
    return null;
  } catch {
    return null;
  }
}

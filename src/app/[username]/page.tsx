import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileByUsername } from "@/lib/db/profiles";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { getProfileUrl } from "@/lib/site-url";
import Link from "next/link";
import SocialIconRow from "@/components/SocialIconRow";
import ProfileShareButton from "@/components/ProfileShareButton";

// Cached per-request so multiple RSC passes with the same username don't
// issue duplicate DB round-trips.
const getProfile = cache(async (username: string) => {
  const supabase = await createClient();
  return fetchProfileByUsername(supabase, username);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return {};

  const url = getProfileUrl(profile.username);
  const name = profile.display_name ?? profile.username;
  const description = profile.bio ?? `${name}'s links on Stackd`;

  return {
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      url,
      ...(profile.avatar_url ? { images: [{ url: profile.avatar_url }] } : {}),
    },
    twitter: {
      card: "summary",
      title: name,
      description,
      ...(profile.avatar_url ? { images: [profile.avatar_url] } : {}),
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const profile = await getProfile(username);
  if (!profile) notFound();

  const { data: links } = await supabase
    .from("links")
    .select("*")
    .eq("profile_id", profile.id)
    .or("enabled.eq.true,kind.eq.section")
    .order("order_index");

  const themeAttr = profile.theme === "default" ? "" : profile.theme;
  const shareUrl = getProfileUrl(profile.username);

  return (
    <main
      data-theme={themeAttr}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        backgroundColor: "var(--bg)",
        fontFamily: "var(--font-family)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "var(--divider)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            fontWeight: 600,
            color: "var(--muted)",
            marginBottom: "16px",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`${profile.display_name ?? profile.username}'s avatar`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            (profile.display_name ?? profile.username).charAt(0).toUpperCase()
          )}
        </div>

        {/* Name */}
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 600,
            letterSpacing: "-0.3px",
            color: "var(--text)",
            textAlign: "center",
            marginBottom: "6px",
          }}
        >
          {profile.display_name ?? profile.username}
        </h1>

        {/* Bio + social icon row */}
        <div
          style={{
            marginBottom: "32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {profile.bio && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--muted)",
                textAlign: "center",
                lineHeight: 1.5,
                maxWidth: "280px",
                margin: 0,
              }}
            >
              {profile.bio}
            </p>
          )}
          {profile.show_social_icons && links && (
            <SocialIconRow links={links} />
          )}
          <ProfileShareButton
            shareUrl={shareUrl}
            displayName={profile.display_name ?? profile.username}
          />
        </div>

        {/* Links */}
        {links && links.length > 0 ? (
          <div style={{ width: "100%" }}>
            {(() => {
              // Split links into segments: section headers and groups of link items
              type Seg =
                | { kind: "section"; id: string; title: string }
                | { kind: "links"; items: typeof links };
              const segments: Seg[] = [];
              let group: typeof links = [];
              for (const link of links) {
                if (link.kind === "section") {
                  if (group.length > 0) {
                    segments.push({ kind: "links", items: group });
                    group = [];
                  }
                  segments.push({
                    kind: "section",
                    id: link.id,
                    title: link.title,
                  });
                } else if (link.url?.trim()) {
                  group.push(link);
                }
              }
              if (group.length > 0)
                segments.push({ kind: "links", items: group });

              return segments.map((seg) => {
                if (seg.kind === "section") {
                  return (
                    <div
                      key={seg.id}
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "var(--text)",
                        padding: "20px 0 8px 14px",
                      }}
                    >
                      {seg.title}
                    </div>
                  );
                }
                return (
                  <div key={seg.items[0].id} style={{ display: "flex" }}>
                    <div
                      style={{
                        width: "2px",
                        backgroundColor: "var(--accent)",
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
                        paddingLeft: 0,
                        margin: 0,
                        minWidth: 0,
                      }}
                    >
                      {seg.items.map((link) => (
                        <li key={link.id}>
                          <a
                            href={`/api/click/${link.id}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "15px 0 15px 14px",
                              textDecoration: "none",
                              color: "var(--text)",
                              width: "100%",
                            }}
                          >
                            <span>
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "14px",
                                  fontWeight: 500,
                                }}
                              >
                                {link.title}
                              </span>
                              {link.subtitle && (
                                <span
                                  style={{
                                    display: "block",
                                    fontSize: "11px",
                                    color: "var(--muted)",
                                    marginTop: "2px",
                                  }}
                                >
                                  {link.subtitle}
                                </span>
                              )}
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "var(--accent)",
                                flexShrink: 0,
                                marginLeft: "12px",
                              }}
                            >
                              →
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <p
            style={{
              fontSize: "13px",
              color: "var(--muted)",
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            nothing here yet — check back soon.
          </p>
        )}

        {/* Footer */}
        <div style={{ marginTop: "40px" }}>
          <Link
            href="/"
            style={{
              fontSize: "11px",
              color: "var(--muted)",
              letterSpacing: "0.5px",
              textDecoration: "underline",
              textDecorationColor: "var(--divider)",
              textUnderlineOffset: "3px",
            }}
          >
            made with stackd
          </Link>
        </div>
      </div>
    </main>
  );
}

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: links } = await supabase
    .from("links")
    .select("*")
    .eq("profile_id", profile.id)
    .or("enabled.eq.true,kind.eq.section")
    .order("order_index");

  const themeAttr = profile.theme === "default" ? "" : profile.theme;

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

        {/* Bio */}
        {profile.bio && (
          <p
            style={{
              fontSize: "13px",
              color: "var(--muted)",
              textAlign: "center",
              lineHeight: 1.5,
              marginBottom: "32px",
              maxWidth: "280px",
            }}
          >
            {profile.bio}
          </p>
        )}

        {!profile.bio && <div style={{ marginBottom: "32px" }} />}

        {/* Links */}
        {links && links.length > 0 ? (
          <ul
            style={{
              width: "100%",
              listStyle: "none",
              borderLeft: "2px solid var(--accent)",
              paddingLeft: 0,
            }}
          >
            {links.map((link) =>
              link.kind === "section" ? (
                <li key={link.id}>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "var(--text)",
                      padding: "20px 0 8px 14px",
                    }}
                  >
                    {link.title}
                  </div>
                </li>
              ) : link.url?.trim() ? (
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
                      <span style={{ display: "block", fontSize: "14px", fontWeight: 500 }}>
                        {link.title}
                      </span>
                      {link.subtitle && (
                        <span style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
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
              ) : null,
            )}
          </ul>
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
            href="/login"
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

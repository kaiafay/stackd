import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

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
    .eq("enabled", true)
    .order("order_index");

  const themeAttr = profile.theme === "light" ? "" : profile.theme;

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
              position: "relative",
              paddingLeft: 0,
            }}
          >
            {/* Left rail */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "15px",
                bottom: "15px",
                width: "2px",
                backgroundColor: "var(--accent)",
              }}
            />
            {links.map((link) => (
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
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>
                    {link.title}
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
          <span
            style={{
              fontSize: "11px",
              color: "var(--muted)",
              letterSpacing: "0.5px",
            }}
          >
            stackd
          </span>
        </div>
      </div>
    </main>
  );
}

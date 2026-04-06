import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ linkId: string }> },
) {
  const { linkId } = await params;
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("links")
    .select("url, kind")
    .eq("id", linkId)
    .single();

  if (!link) redirect("/");

  if (link.kind === "section" || !link.url) {
    return new Response("Bad Request", { status: 400 });
  }

  // Only allow safe http/https URLs — reject javascript:, data:, etc.
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(link.url);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return new Response("Bad Request", { status: 400 });
  }

  // Atomic server-side increment — no read-modify-write race.
  // Requires a Supabase function:
  //   create or replace function increment_link_click(link_id uuid)
  //   returns void language sql as $$
  //     update links set click_count = click_count + 1 where id = link_id;
  //   $$;
  await supabase.rpc("increment_link_click", { link_id: linkId });

  // redirect() throws internally in Next.js, so the update above must be
  // awaited before this line — not after.
  // Use parsedUrl.href (the canonicalized form) rather than the raw DB value.
  redirect(parsedUrl.href);
}

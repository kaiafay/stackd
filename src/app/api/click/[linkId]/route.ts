import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ linkId: string }> },
) {
  const { linkId } = await params;
  const supabase = await createClient();

  // Select only the URL — click_count is no longer read in application code.
  const { data: link } = await supabase
    .from("links")
    .select("url")
    .eq("id", linkId)
    .single();

  if (!link) redirect("/");

  // Atomic server-side increment — no read-modify-write race.
  // Requires a Supabase function:
  //   create or replace function increment_link_click(link_id uuid)
  //   returns void language sql as $$
  //     update links set click_count = click_count + 1 where id = link_id;
  //   $$;
  await supabase.rpc("increment_link_click", { link_id: linkId });

  // redirect() throws internally in Next.js, so the update above must be
  // awaited before this line — not after.
  redirect(link.url);
}

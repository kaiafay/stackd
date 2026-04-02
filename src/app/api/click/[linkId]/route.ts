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
    .select("url, click_count")
    .eq("id", linkId)
    .single();

  if (!link) redirect("/");

  supabase
    .from("links")
    .update({ click_count: link.click_count + 1 })
    .eq("id", linkId);

  redirect(link.url);
}

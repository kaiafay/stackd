"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type Link = {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  order_index: number;
  enabled: boolean;
  click_count: number;
};

export function useLinks(profileId: string) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!profileId) return;
    fetchLinks();
  }, [profileId]);

  async function fetchLinks() {
    setLoading(true);
    const { data } = await supabase
      .from("links")
      .select("*")
      .eq("profile_id", profileId)
      .order("order_index");
    setLinks(data ?? []);
    setLoading(false);
  }

  async function addLink(title: string, url: string) {
    const order_index = links.length;
    const { data } = await supabase
      .from("links")
      .insert({ profile_id: profileId, title, url, order_index })
      .select()
      .single();
    if (data) setLinks((prev) => [...prev, data]);
  }

  async function updateLink(
    id: string,
    updates: Partial<Pick<Link, "title" | "url" | "enabled">>,
  ) {
    const { data } = await supabase
      .from("links")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (data) setLinks((prev) => prev.map((l) => (l.id === id ? data : l)));
  }

  async function deleteLink(id: string) {
    await supabase.from("links").delete().eq("id", id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  async function reorderLinks(reordered: Link[]) {
    setLinks(reordered);
    await supabase
      .from("links")
      .upsert(reordered.map((l, i) => ({ ...l, order_index: i })));
  }

  return { links, loading, addLink, updateLink, deleteLink, reorderLinks };
}

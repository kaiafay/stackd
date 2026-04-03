"use client";

import { useState, useEffect, useRef } from "react";
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

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function useLinks(profileId: string) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

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

  async function addLink(title: string, url: string): Promise<{ error: Error | null }> {
    const order_index = links.length;
    const normalized = normalizeUrl(url);
    const { data, error } = await supabase
      .from("links")
      .insert({ profile_id: profileId, title, url: normalized, order_index })
      .select()
      .single();
    if (error) return { error };
    if (data) setLinks((prev) => [...prev, data]);
    return { error: null };
  }

  async function updateLink(
    id: string,
    updates: Partial<Pick<Link, "title" | "url" | "enabled">>,
  ) {
    const normalized = updates.url
      ? { ...updates, url: normalizeUrl(updates.url) }
      : updates;
    const { data } = await supabase
      .from("links")
      .update(normalized)
      .eq("id", id)
      .select()
      .single();
    if (data) setLinks((prev) => prev.map((l) => (l.id === id ? data : l)));
  }

  async function deleteLink(id: string) {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (!error) setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  async function reorderLinks(reordered: Link[]) {
    const previous = links;
    setLinks(reordered);
    const { error } = await supabase
      .from("links")
      .upsert(reordered.map((l, i) => ({ ...l, order_index: i })));
    if (error) setLinks(previous);
  }

  return { links, loading, addLink, updateLink, deleteLink, reorderLinks };
}

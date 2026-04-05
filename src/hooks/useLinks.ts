"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Link } from "@/types";

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
    fetchLinks();
  }, [profileId]);

  async function addLink(title: string, url: string): Promise<{ error: Error | null }> {
    const order_index = links.length;
    const normalized = normalizeUrl(url);
    const { data, error } = await supabase
      .from("links")
      .insert({ profile_id: profileId, title, url: normalized, order_index, kind: "link" })
      .select()
      .single();
    if (error) return { error };
    if (data) setLinks((prev) => [...prev, data]);
    return { error: null };
  }

  async function addSection(): Promise<{ error: Error | null }> {
    const order_index = links.length;
    const { data, error } = await supabase
      .from("links")
      .insert({ profile_id: profileId, title: "New Section", kind: "section", order_index })
      .select()
      .single();
    if (error) return { error };
    if (data) setLinks((prev) => [...prev, data]);
    return { error: null };
  }

  async function updateLink(
    id: string,
    updates: Partial<Pick<Link, "title" | "subtitle" | "url" | "enabled">>,
  ): Promise<{ error: { message: string } | null }> {
    const normalized = updates.url
      ? { ...updates, url: normalizeUrl(updates.url) }
      : updates;
    const { data, error } = await supabase
      .from("links")
      .update(normalized)
      .eq("id", id)
      .select()
      .single();
    if (data) setLinks((prev) => prev.map((l) => (l.id === id ? data : l)));
    return { error: error ?? null };
  }

  async function deleteLink(id: string): Promise<{ error: { message: string } | null }> {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (!error) setLinks((prev) => prev.filter((l) => l.id !== id));
    return { error: error ?? null };
  }

  async function reorderLinks(reordered: Link[]) {
    const previous = links;
    setLinks(reordered);
    const { error } = await supabase
      .from("links")
      .upsert(reordered.map((l, i) => ({ id: l.id, order_index: i })));
    if (error) setLinks(previous);
  }

  return { links, loading, addLink, addSection, updateLink, deleteLink, reorderLinks };
}

import { db, USER_ID } from "./supabase";
import type { MemoryFact, Profile } from "./types";

/**
 * Memory access (doc §7).
 *
 * For a single user we keep this simple: load the whole flat fact table
 * and the foundational briefing. Once the table grows large, this is the
 * one function to make smarter (e.g. embed facts and fetch only the slice
 * relevant to the current request) — nothing else has to change.
 */
export async function loadMemory(): Promise<MemoryFact[]> {
  const { data, error } = await db
    .from("memory")
    .select("*")
    .eq("user_id", USER_ID)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as MemoryFact[];
}

export async function loadProfile(): Promise<Profile | null> {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("user_id", USER_ID)
    .maybeSingle();

  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function addFact(
  fact: string,
  category = "general",
  source: "user" | "inferred" = "user"
): Promise<MemoryFact> {
  const { data, error } = await db
    .from("memory")
    .insert({ user_id: USER_ID, fact, category, source })
    .select()
    .single();

  if (error) throw error;
  return data as MemoryFact;
}

export async function deleteFact(id: string): Promise<void> {
  const { error } = await db
    .from("memory")
    .delete()
    .eq("id", id)
    .eq("user_id", USER_ID);
  if (error) throw error;
}

export async function saveBriefingText(text: string): Promise<void> {
  const { error } = await db
    .from("profiles")
    .upsert({ user_id: USER_ID, briefing: text, updated_at: new Date().toISOString() });
  if (error) throw error;
}

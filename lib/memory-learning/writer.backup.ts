import { db, USER_ID } from "@/lib/supabase";
import type { ExtractedMemoryFact, MemoryApprovalItem } from "./types";

export type SavedMemory = {
  id: string;
  type: ExtractedMemoryFact["type"];
  title: string;
  value: string;
  source?: string;
  confidence: number;
  createdAt: string;
  approvalId: string;
};

const savedMemories: SavedMemory[] = [];

export async function saveApprovedMemory(
  item: MemoryApprovalItem
): Promise<SavedMemory | null> {
  if (item.status !== "approved") return null;

  const fact = item.change.fact;

  const memory: SavedMemory = {
    id: crypto.randomUUID(),
    type: fact.type,
    title: fact.title,
    value: fact.value,
    source: fact.source,
    confidence: fact.confidence,
    createdAt: new Date().toISOString(),
    approvalId: item.id,
  };

  const { data: existingMainMemory, error: existingMainError } = await db
    .from("memory")
    .select("id")
    .eq("user_id", USER_ID)
    .eq("fact", memory.value)
    .maybeSingle();

  if (existingMainError) {
    throw new Error(`Failed to check main memory duplicate: ${existingMainError.message}`);
  }

  if (!existingMainMemory) {
    const { error: mainMemoryError } = await db.from("memory").insert({
      user_id: USER_ID,
      fact: memory.value,
      category: memory.type || "general",
      source: "inferred",
    });

    if (mainMemoryError) {
      throw new Error(`Failed to save approved memory to main memory: ${mainMemoryError.message}`);
    }
  }

  const { data: existingMemory, error: existingError } = await db
    .from("cipher_memories")
    .select("id")
    .eq("value", memory.value)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to check duplicate saved memory: ${existingError.message}`);
  }

  if (!existingMemory) {
    const { error } = await db.from("cipher_memories").insert({
      id: memory.id,
      type: memory.type,
      title: memory.title,
      value: memory.value,
      source: memory.source,
      confidence: memory.confidence,
      approval_id: memory.approvalId,
      created_at: memory.createdAt,
    });

    if (error) {
      throw new Error(`Failed to save memory to Supabase: ${error.message}`);
    }
  }

  savedMemories.push(memory);
  return memory;
}

export function getSavedMemories(): SavedMemory[] {
  return savedMemories;
}
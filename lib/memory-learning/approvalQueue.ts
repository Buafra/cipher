import { db } from "@/lib/supabase";
import type { MemoryApprovalItem, MemoryChange } from "./types";

function rowToApprovalItem(row: any): MemoryApprovalItem {
  return {
    id: row.id,
    status: row.status,
    change: {
      changeType: row.change_type,
      fact: {
        type: row.fact_type,
        title: row.fact_title,
        value: row.fact_value,
        source: row.fact_source,
        confidence: Number(row.confidence ?? 0.6),
      },
      existingMemory: row.existing_memory ?? undefined,
      recommendation: row.recommendation,
    },
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at ?? undefined,
  };
}

export async function addToApprovalQueue(
  changes: MemoryChange[]
): Promise<MemoryApprovalItem[]> {
  const rows = changes
    .filter((change) => change.changeType !== "duplicate")
    .map((change) => ({
      status: "pending",
      change_type: change.changeType,
      fact_type: change.fact.type,
      fact_title: change.fact.title,
      fact_value: change.fact.value,
      fact_source: change.fact.source,
      confidence: change.fact.confidence,
      recommendation: change.recommendation,
      existing_memory: change.existingMemory,
    }));

  if (rows.length === 0) return [];

  const { data, error } = await db
    .from("memory_approval_queue")
    .insert(rows)
    .select();

  if (error) {
    throw new Error(`Failed to add approval queue items: ${error.message}`);
  }

  return (data ?? []).map(rowToApprovalItem);
}

export async function getApprovalQueue(): Promise<MemoryApprovalItem[]> {
  const { data, error } = await db
    .from("memory_approval_queue")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load approval queue: ${error.message}`);
  }

  return (data ?? []).map(rowToApprovalItem);
}

export async function reviewApprovalItem(input: {
  id: string;
  status: "approved" | "rejected";
}): Promise<MemoryApprovalItem | null> {
  const { data, error } = await db
    .from("memory_approval_queue")
    .update({
      status: input.status,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    return null;
  }

  return rowToApprovalItem(data);
}
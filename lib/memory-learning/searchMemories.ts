import { db } from "@/lib/supabase";

export type CipherMemorySearchResult = {
  id: string;
  type: string;
  title: string;
  value: string;
  source?: string | null;
  confidence?: number | null;
  created_at?: string | null;
};

function extractSearchKeywords(input: string) {
  const stopWords = new Set([
    "what",
    "remember",
    "about",
    "tell",
    "know",
    "please",
    "can",
    "you",
    "the",
    "and",
    "for",
    "with",
  ]);

  return input
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 6);
}

export async function searchCipherMemories(
  query: string,
  limit = 8
): Promise<CipherMemorySearchResult[]> {
const keywords = extractSearchKeywords(query);

if (keywords.length === 0) return [];

const orQuery = keywords
  .flatMap((keyword) => [
    `title.ilike.%${keyword}%`,
    `value.ilike.%${keyword}%`,
    `type.ilike.%${keyword}%`,
  ])
  .join(",");

const { data, error } = await db
  .from("cipher_memories")
  .select("id,type,title,value,source,confidence,created_at")
  .or(orQuery)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Memory search failed:", error);
    return [];
  }

  return data ?? [];
}

export function formatCipherMemoriesForPrompt(
  memories: CipherMemorySearchResult[]
) {
  if (memories.length === 0) {
    return "No relevant saved Cipher memories found.";
  }

  return memories
    .map(
      (memory, index) =>
        `${index + 1}. [${memory.type}] ${memory.title}: ${memory.value}${
          memory.source ? ` (source: ${memory.source})` : ""
        }`
    )
    .join("\n");
}
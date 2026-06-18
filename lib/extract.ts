import { reason, type ChatTurn } from "./claude";
import type { MemoryFact } from "./types";

/**
 * Phase 1.5 — Auto-memory.
 *
 * After a chat exchange, ask the model to pull out any DURABLE facts about
 * the person so Cipher learns without them visiting the Memory screen.
 * Returns structured facts; the caller dedupes and stores them with
 * source: 'inferred'.
 */
export type ExtractedFact = { category: string; fact: string };

const VALID = ["preference", "person", "commitment", "project", "general"];

const SYSTEM = `You extract durable personal facts about the user from a conversation, so a private assistant can remember them later.

Return ONLY a JSON array. Each item: { "category": one of ["preference","person","commitment","project","general"], "fact": a short third-person statement }.

Rules:
- Keep only DURABLE facts that stay true beyond this moment: stable preferences, named people and relationships, recurring commitments, ongoing projects, lasting constraints.
- Ignore one-off or ephemeral details (a single question, today's plan, a passing mood, anything time-bound to right now).
- Do NOT include anything already in the "Already known" list, even reworded.
- Write each fact tersely in the third person ("Prefers aisle seats", "Daughter Mara, age 7").
- If there is nothing new and durable, return [].
- Output the JSON array and nothing else — no prose, no code fences.`;

export async function extractFacts(
  recentTurns: ChatTurn[],
  knownFacts: MemoryFact[]
): Promise<ExtractedFact[]> {
  const known = knownFacts.map((f) => `- ${f.fact}`).join("\n") || "(none)";
  const convo = recentTurns.map((t) => `${t.role}: ${t.content}`).join("\n");

  const raw = await reason(
    SYSTEM,
    [
      {
        role: "user",
        content: `Already known:\n${known}\n\nConversation:\n${convo}\n\nExtract new durable facts as a JSON array.`,
      },
    ],
    500
  );

  return parse(raw);
}

/** Tolerant JSON parsing — models sometimes wrap output or add stray text. */
function parse(raw: string): ExtractedFact[] {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const candidates = [cleaned, cleaned.match(/\[[\s\S]*\]/)?.[0]].filter(Boolean) as string[];

  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c);
      if (!Array.isArray(parsed)) continue;
      return parsed
        .filter((x) => x && typeof x.fact === "string" && x.fact.trim())
        .map((x) => ({
          category: VALID.includes(x.category) ? x.category : "general",
          fact: String(x.fact).trim(),
        }));
    } catch {
      // try the next candidate
    }
  }
  return [];
}

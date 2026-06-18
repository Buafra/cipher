import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { loadMemory, addFact } from "@/lib/memory";
import { extractFacts } from "@/lib/extract";
import type { ChatTurn } from "@/lib/claude";

export const runtime = "nodejs";

/**
 * POST /api/memory/extract   (Phase 1.5)
 * Body: { conversationId }
 *
 * Called by the chat UI right AFTER a reply lands — in its own request, so
 * it never slows the conversation. Looks at the last few turns, asks the
 * model for new durable facts, dedupes against what's already stored, and
 * saves the new ones as 'inferred'. Returns what it added so the UI can
 * show the person what Cipher just learned.
 */
export async function POST(req: NextRequest) {
  try {
    const { conversationId } = await req.json();
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const { data: history } = await db
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(4);

    const turns: ChatTurn[] = (history ?? [])
      .reverse()
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const known = await loadMemory();
    const candidates = await extractFacts(turns, known);

    // Dedupe case-insensitively against existing facts and within this batch.
    const seen = new Set(known.map((f) => f.fact.toLowerCase().trim()));
    const added = [];
    for (const c of candidates) {
      const key = c.fact.toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      added.push(await addFact(c.fact, c.category, "inferred"));
    }

    return NextResponse.json({ added });
  } catch (err: any) {
    console.error("[/api/memory/extract]", err);
    return NextResponse.json({ error: err.message ?? "extraction failed" }, { status: 500 });
  }
}

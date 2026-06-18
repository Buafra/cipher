import { NextRequest, NextResponse } from "next/server";
import { db, USER_ID } from "@/lib/supabase";
import { loadMemory, loadProfile } from "@/lib/memory";
import { buildSystemPrompt } from "@/lib/prompt";
import { reason, type ChatTurn } from "@/lib/claude";

export const runtime = "nodejs";

/**
 * POST /api/chat   (Layer 1 → Layer 3, via this relay)
 * Body: { message: string, conversationId?: string }
 *
 * This is the data flow from doc §4:
 *   1. receive the request
 *   2. gather stored context (memory + recent history)
 *   3. (live lookups would go here — see Phase 3)
 *   4. send combined context to the reasoning model
 *   5. return the reply and save it back to storage
 */
export async function POST(req: NextRequest) {
  try {
    const { message, conversationId } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    // Ensure a conversation exists.
    let convId = conversationId as string | undefined;
    if (!convId) {
      const { data, error } = await db
        .from("conversations")
        .insert({ user_id: USER_ID, title: message.slice(0, 40) })
        .select("id")
        .single();
      if (error) throw error;
      convId = data.id;
    }

    // Save the incoming user message.
    await db.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    });

    // 2 — gather stored context.
    const [profile, facts] = await Promise.all([loadProfile(), loadMemory()]);

    const { data: history } = await db
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20);

    const system = buildSystemPrompt(profile, facts);
    const turns: ChatTurn[] = (history ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // 4 — reason.
    const reply = await reason(system, turns);

    // 5 — persist the assistant reply.
    await db.from("messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: reply,
    });

    return NextResponse.json({ reply, conversationId: convId });
  } catch (err: any) {
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: err.message ?? "Something went wrong" }, { status: 500 });
  }
}

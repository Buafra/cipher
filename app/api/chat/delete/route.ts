import { NextRequest, NextResponse } from "next/server";
import { db, USER_ID } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/chat/delete   Body: { id }
 * Deletes a conversation and its messages. Surfaces the real DB error so
 * failures are diagnosable instead of a generic "failed".
 */
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Delete child messages first (safe whether or not the FK cascades).
    const { error: msgErr } = await db
      .from("messages")
      .delete()
      .eq("conversation_id", id);
    if (msgErr) {
      return NextResponse.json({ error: `messages: ${msgErr.message}` }, { status: 500 });
    }

    // Delete the conversation itself.
    const { data: deleted, error: convErr } = await db
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", USER_ID)
      .select("id");
    if (convErr) {
      return NextResponse.json({ error: `conversation: ${convErr.message}` }, { status: 500 });
    }

    // Idempotent success: if nothing matched, it's already gone.
    return NextResponse.json({ ok: true, deletedCount: deleted?.length ?? 0 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to delete chat" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { db, USER_ID } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: conversation, error: convError } = await db
      .from("conversations")
      .select("id")
      .eq("user_id", USER_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (convError) throw convError;

    if (!conversation?.id) {
      return NextResponse.json({
        conversationId: null,
        messages: [],
      });
    }

    const { data: messages, error: msgError } = await db
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .limit(50);

    if (msgError) throw msgError;

    return NextResponse.json({
      conversationId: conversation.id,
      messages: messages ?? [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to load chat history" },
      { status: 500 }
    );
  }
}
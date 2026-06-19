import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function listConversations() {
  const { data, error } = await db
    .from("conversations")
    .select("id,title,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function GET() {
  try {
    const conversations = await listConversations();
    return NextResponse.json({ conversations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { deleteId } = await req.json();

    await db.from("messages").delete().eq("conversation_id", deleteId);
    await db.from("conversations").delete().eq("id", deleteId);

    const conversations = await listConversations();

    return NextResponse.json({
      ok: true,
      conversations,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
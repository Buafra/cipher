import { NextRequest, NextResponse } from "next/server";
import { db, USER_ID } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.from("messages").delete().eq("conversation_id", id);

    const { data, error } = await db
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", USER_ID)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: `No conversation deleted for id ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, deletedCount: data.length, deleted: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to delete chat" },
      { status: 500 }
    );
  }
}
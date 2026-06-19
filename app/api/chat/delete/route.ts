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

    const { data: deleted, error: deleteError } = await db
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", USER_ID)
      .select("id");

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (!deleted || deleted.length === 0) {
      return NextResponse.json(
        { error: "Conversation was not deleted. No matching row found." },
        { status: 404 }
      );
    }

    const { data: stillExists } = await db
      .from("conversations")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (stillExists) {
      return NextResponse.json(
        { error: "Conversation still exists after delete." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, deleted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to delete chat" },
      { status: 500 }
    );
  }
}
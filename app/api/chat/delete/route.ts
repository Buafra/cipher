import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error: msgError } = await db
      .from("messages")
      .delete()
      .eq("conversation_id", id);

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    const { data, error: convError } = await db
      .from("conversations")
      .delete()
      .eq("id", id)
      .select("id, title");

    if (convError) {
      return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      requestedId: id,
      deletedCount: data?.length ?? 0,
      deleted: data ?? [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to delete chat" },
      { status: 500 }
    );
  }
}
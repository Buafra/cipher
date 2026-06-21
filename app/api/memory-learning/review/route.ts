import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { saveApprovedMemory } from "@/lib/memory-learning/writer";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const id = String(body.id ?? "");
    const status = String(body.status ?? "");

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "Missing id or status" }, { status: 400 });
    }

    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json({ ok: false, error: "Status must be approved or rejected" }, { status: 400 });
    }

    const reviewedAt = new Date().toISOString();

    const { data: row, error } = await db
      .from("memory_approval_queue")
      .update({
        status,
        reviewed_at: reviewedAt,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !row) {
      return NextResponse.json(
        { ok: false, error: error?.message ?? "Approval item not found" },
        { status: 500 }
      );
    }

    const item = {
      id: row.id,
      status: row.status,
      change: {
        changeType: row.change_type,
        fact: {
          type: row.fact_type,
          title: row.fact_title,
          value: row.fact_value,
          source: row.fact_source,
          confidence: Number(row.confidence ?? 0.6),
        },
        existingMemory: row.existing_memory ?? undefined,
        recommendation: row.recommendation,
      },
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
    };

    const savedMemory =
      status === "approved" ? await saveApprovedMemory(item as any) : null;

    return NextResponse.json({
      ok: true,
      item,
      savedMemory,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to review approval item",
      },
      { status: 500 }
    );
  }
}
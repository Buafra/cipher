import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { data, error } = await db
    .from("morning_briefings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: "No briefing found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    briefing: data,
  });
}
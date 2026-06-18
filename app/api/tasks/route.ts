import { NextRequest, NextResponse } from "next/server";
import { db, USER_ID } from "@/lib/supabase";

export const runtime = "nodejs";

/** GET /api/tasks — list open tasks, soonest due first. */
export async function GET() {
  const { data, error } = await db
    .from("tasks")
    .select("*")
    .eq("user_id", USER_ID)
    .order("status", { ascending: true })
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data });
}

/** POST /api/tasks — create a task. Body: { title, notes?, due_at? } */
export async function POST(req: NextRequest) {
  const { title, notes, due_at } = await req.json();
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const { data, error } = await db
    .from("tasks")
    .insert({ user_id: USER_ID, title, notes: notes ?? "", due_at: due_at ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

/** PATCH /api/tasks — toggle status. Body: { id, status } */
export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await db
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .eq("user_id", USER_ID);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

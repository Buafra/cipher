import { NextRequest, NextResponse } from "next/server";
import { db, USER_ID } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const { data, error } = await db
    .from("tasks")
    .select("*")
    .eq("user_id", USER_ID)
    .order("status", { ascending: true })
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { title, notes, due_at } = await req.json();

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const { data, error } = await db
    .from("tasks")
    .insert({
      user_id: USER_ID,
      title,
      notes: notes ?? "",
      due_at: due_at || null,
      status: "open",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { data, error } = await db
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .eq("user_id", USER_ID)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await db
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", USER_ID);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
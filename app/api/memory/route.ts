import { NextRequest, NextResponse } from "next/server";
import { loadMemory, addFact, deleteFact } from "@/lib/memory";

export const runtime = "nodejs";

/** GET /api/memory — list all stored facts. */
export async function GET() {
  try {
    const facts = await loadMemory();
    return NextResponse.json({ facts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** POST /api/memory — add a fact. Body: { fact, category? } */
export async function POST(req: NextRequest) {
  try {
    const { fact, category } = await req.json();
    if (!fact) return NextResponse.json({ error: "fact is required" }, { status: 400 });
    const created = await addFact(fact, category ?? "general", "user");
    return NextResponse.json({ fact: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** DELETE /api/memory?id=... — remove a fact. */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await deleteFact(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

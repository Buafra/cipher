import { NextResponse } from "next/server";
import { deleteFact } from "@/lib/memory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing memory id" },
      { status: 400 }
    );
  }

  await deleteFact(id);

  return NextResponse.json({
    ok: true,
    deleted: id,
  });
}
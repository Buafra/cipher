import { NextResponse } from "next/server";
import { getSavedMemories } from "@/lib/memory-learning/writer";

export async function GET() {
  return NextResponse.json({
    ok: true,
    memories: getSavedMemories(),
  });
}
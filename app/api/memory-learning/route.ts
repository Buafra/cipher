import { NextResponse } from "next/server";
import { extractMemoryFacts } from "@/lib/memory-learning/extractor";
import { compareWithExistingMemory } from "@/lib/memory-learning/comparator";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const facts = await extractMemoryFacts({
      text: body.text ?? "",
      source: body.source ?? "manual-input",
    });

    const changes = await compareWithExistingMemory({
      facts,
      existingMemories: body.existingMemories ?? [],
    });

    return NextResponse.json({
      ok: true,
      phase: "1B",
      facts,
      changes,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to process memory learning request",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Cipher Phase 1B Memory Learning Engine",
  });
}
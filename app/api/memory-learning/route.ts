import { NextResponse } from "next/server";
import { extractMemoryFacts } from "@/lib/memory-learning/extractor";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const facts = await extractMemoryFacts({
      text: body.text ?? "",
      source: body.source ?? "manual-input",
    });

    return NextResponse.json({
      ok: true,
      phase: "1B",
      facts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to extract memory facts",
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
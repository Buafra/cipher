import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "Memory Learning Engine API is ready",
    phase: "1B",
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Cipher Phase 1B Memory Learning Engine",
  });
}
import { NextResponse } from "next/server";
import { getApprovalQueue } from "@/lib/memory-learning/approvalQueue";

export async function GET() {
  try {
    const approvalQueue = await getApprovalQueue();

    return NextResponse.json({
      ok: true,
      approvalQueue,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load approval queue",
      },
      { status: 500 }
    );
  }
}
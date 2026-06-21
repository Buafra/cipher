import { NextResponse } from "next/server";
import { reviewApprovalItem } from "@/lib/memory-learning/approvalQueue";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.id || !body.status) {
      return NextResponse.json(
        { ok: false, error: "Missing id or status" },
        { status: 400 }
      );
    }

    if (body.status !== "approved" && body.status !== "rejected") {
      return NextResponse.json(
        { ok: false, error: "Status must be approved or rejected" },
        { status: 400 }
      );
    }

    const item = reviewApprovalItem({
      id: body.id,
      status: body.status,
    });

    if (!item) {
      return NextResponse.json(
        { ok: false, error: "Approval item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to review approval item" },
      { status: 500 }
    );
  }
}
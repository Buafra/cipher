import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = (body.query ?? "").trim();

    if (!query) {
      return NextResponse.json(
        { ok: false, error: "Missing query" },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("cipher_memories")
      .select("*")
      .or(
        `title.ilike.%${query}%,value.ilike.%${query}%,type.ilike.%${query}%`
      )
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      query,
      results: data ?? [],
      count: data?.length ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Memory search failed",
      },
      { status: 500 }
    );
  }
}
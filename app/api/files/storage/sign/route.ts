import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LARGE_UPLOAD_BYTES = 50 * 1024 * 1024;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase env vars for large upload signing.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function safeFileName(name: string) {
  return name
    .replace(/[^\w.\-()[\] ]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 160);
}

export async function POST(req: Request) {
  try {
    const { fileName, mimeType, sizeBytes } = await req.json();

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    if (!sizeBytes || typeof sizeBytes !== "number") {
      return NextResponse.json({ error: "sizeBytes is required" }, { status: 400 });
    }

    if (sizeBytes > MAX_LARGE_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `${fileName} is too large. Max size is 50 MB.` },
        { status: 400 }
      );
    }

    const bucket = process.env.NEXT_PUBLIC_SUPABASE_UPLOAD_BUCKET ?? "cipher-uploads";
    const supabase = getAdminClient();

    const path = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFileName(fileName)}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path, {
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      bucket,
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      mimeType: mimeType || "application/octet-stream",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to create large upload URL" },
      { status: 500 }
    );
  }
}

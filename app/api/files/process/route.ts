import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseUploadedFile } from "@/lib/file-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LARGE_UPLOAD_BYTES = 50 * 1024 * 1024;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase env vars for large upload processing.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function POST(req: Request) {
  try {
    const { bucket, path, fileName, mimeType, sizeBytes } = await req.json();

    if (!bucket || !path || !fileName) {
      return NextResponse.json(
        { error: "bucket, path, and fileName are required" },
        { status: 400 }
      );
    }

    if (sizeBytes && sizeBytes > MAX_LARGE_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `${fileName} is too large. Max size is 50 MB.` },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: "Uploaded file was not found in storage." }, { status: 404 });
    }

    const file = new File([data], fileName, {
      type: mimeType || data.type || "application/octet-stream",
    });

    const parsed = await parseUploadedFile(file);

    return NextResponse.json({
      file: {
        ...parsed,
        note: parsed.note
          ? `${parsed.note} Processed from Supabase Storage.`
          : "Processed from Supabase Storage.",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to process large uploaded file" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { parseUploadedFile } from "@/lib/file-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILES = 8;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files").filter((item): item is File => item instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Upload up to ${MAX_FILES} files at a time.` }, { status: 400 });
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `${file.name} is too large. Max size is 50 MB.` },
          { status: 400 },
        );
      }
    }

    const parsed = await Promise.all(files.map((file) => parseUploadedFile(file)));

    return NextResponse.json({ files: parsed });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Upload failed" },
      { status: 500 },
    );
  }
}

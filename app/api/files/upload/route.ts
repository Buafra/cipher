import { NextResponse } from "next/server";
import { parseUploadedFile } from "@/lib/file-parser";
import { extractMemoryFacts } from "@/lib/memory-learning/extractor";
import { compareWithExistingMemory } from "@/lib/memory-learning/comparator";
import { addToApprovalQueue } from "@/lib/memory-learning/approvalQueue";

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

  const learnMemory = formData.get("learnMemory") === "true";
const existingMemoriesRaw = formData.get("existingMemories");
const existingMemories =
  typeof existingMemoriesRaw === "string" && existingMemoriesRaw
    ? JSON.parse(existingMemoriesRaw)
    : [];

const parsed = await Promise.all(files.map((file) => parseUploadedFile(file)));

const memoryLearning = [];

if (learnMemory) {
  for (const file of parsed) {
    if (!file.text) continue;

    const facts = await extractMemoryFacts({
      text: file.text,
      source: file.fileName,
    });

    const changes = await compareWithExistingMemory({
      facts,
      existingMemories,
    });

    const approvalItems = await addToApprovalQueue(changes);

    memoryLearning.push({
      fileName: file.fileName,
      facts,
      changes,
      approvalItems,
      count: approvalItems.length,
    });
  }
}

return NextResponse.json({
  ok: true,
  phase: "1C",
  feature: "document-intelligence",
  files: parsed,
  memoryLearning,
});
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Upload failed" },
      { status: 500 },
    );
  }
}

"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

export type UploadedFileContext = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: string;
  text: string;
  extracted: boolean;
  note?: string;
};

type MemoryLearningResult = {
  fileName: string;
  count: number;
};

type FileUploadProps = {
  files: UploadedFileContext[];
  onFilesAdded: (files: UploadedFileContext[]) => void;
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
  showButton?: boolean;
  showList?: boolean;
};

const SMALL_UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024;
const MAX_LARGE_UPLOAD_BYTES = 50 * 1024 * 1024;

function parseJsonSafely(raw: string) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { error: raw || "Upload failed" };
  }
}

function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Large upload needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createClient(url, anonKey);
}

export function FileUpload({
  files,
  onFilesAdded,
  onRemoveFile,
  disabled,
  showButton = true,
  showList = true,
}: FileUploadProps) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [learnMemory, setLearnMemory] = useState(false);
  const [memoryLearning, setMemoryLearning] = useState<MemoryLearningResult[]>([]);

  async function uploadSmallFiles(fileList: File[]) {
    const formData = new FormData();
    fileList.forEach((file) => formData.append("files", file));

    if (learnMemory) {
      formData.append("learnMemory", "true");
    }

    const res = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    });

    const raw = await res.text();
    const data = parseJsonSafely(raw);

    if (!res.ok) {
      throw new Error(data.error ?? "Upload failed");
    }

    if (Array.isArray(data.memoryLearning)) {
      setMemoryLearning(data.memoryLearning);
    }

    return data.files ?? [];
  }

  async function uploadLargeFile(file: File) {
    if (file.size > MAX_LARGE_UPLOAD_BYTES) {
      throw new Error(`${file.name} is too large. Max large upload size is 50 MB.`);
    }

    const signRes = await fetch("/api/files/storage/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      }),
    });

    const signRaw = await signRes.text();
    const signData = parseJsonSafely(signRaw);

    if (!signRes.ok) {
      throw new Error(signData.error ?? "Failed to prepare large upload");
    }

    const supabase = getSupabaseBrowserClient();
    const { error: uploadError } = await supabase.storage
      .from(signData.bucket)
      .uploadToSignedUrl(signData.path, signData.token, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const processRes = await fetch("/api/files/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucket: signData.bucket,
        path: signData.path,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        learnMemory,
      }),
    });

    const processRaw = await processRes.text();
    const processData = parseJsonSafely(processRaw);

    if (!processRes.ok) {
      throw new Error(processData.error ?? "Failed to process large file");
    }

    if (processData.memoryLearning) {
      setMemoryLearning([processData.memoryLearning]);
    }

    return processData.file;
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length || disabled || uploading) return;

    setError("");
    setMemoryLearning([]);
    setUploading(true);

    try {
      const selectedFiles = Array.from(fileList);
      const smallFiles = selectedFiles.filter((file) => file.size <= SMALL_UPLOAD_LIMIT_BYTES);
      const largeFiles = selectedFiles.filter((file) => file.size > SMALL_UPLOAD_LIMIT_BYTES);

      const parsedFiles: UploadedFileContext[] = [];

      if (smallFiles.length) {
        parsedFiles.push(...(await uploadSmallFiles(smallFiles)));
      }

      for (const file of largeFiles) {
        parsedFiles.push(await uploadLargeFile(file));
      }

      onFilesAdded(parsedFiles);
      setError("");
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const totalMemoryCandidates = memoryLearning.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <div className="space-y-3">
      {showButton && (
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={
              "inline-flex rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-paper-dim hover:text-paper " +
              (disabled || uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer")
            }
          >
            {uploading ? "Uploading…" : "Upload"}
            <input
              type="file"
              multiple
              disabled={disabled || uploading}
              className="hidden"
              accept=".pdf,.docx,.xlsx,.xls,.csv,.pptx,.txt,.md,.json,.html,.htm,.xml,.log,.png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.m4a,.mp4,.mov,.zip"
              onChange={async (event) => {
                const input = event.target;
                try {
                  await handleUpload(input.files);
                } finally {
                  input.value = "";
                }
              }}
            />
          </label>

          <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-paper-dim">
            <input
              type="checkbox"
              checked={learnMemory}
              disabled={disabled || uploading}
              onChange={(event) => setLearnMemory(event.target.checked)}
            />
            Learn from document
          </label>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {memoryLearning.length > 0 && (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          Document Intelligence created {totalMemoryCandidates} memory candidate(s).
          Review them in Memory Review.
        </div>
      )}

      {showList && files.length > 0 && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
          <p className="eyebrow mb-2">Uploaded Context</p>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.fileName}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs text-paper">{file.fileName}</p>
                  <p className="mt-1 text-[10px] text-paper-faint">
                    {file.kind.toUpperCase()} · {(file.sizeBytes / 1024).toFixed(1)} KB ·{" "}
                    {file.extracted ? "text extracted" : "metadata only"}
                  </p>
                  {file.note && (
                    <p className="mt-1 text-[10px] text-paper-faint">{file.note}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveFile(index)}
                  className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-paper-faint hover:text-paper"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <p className="mt-2 text-xs text-paper-faint">
            Send a message to analyze these files in this chat.
          </p>
        </div>
      )}
    </div>
  );
}
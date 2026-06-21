"use client";

import { useState } from "react";

export type UploadedFileContext = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: string;
  text: string;
  extracted: boolean;
  note?: string;
};

type FileUploadProps = {
  files: UploadedFileContext[];
  onFilesAdded: (files: UploadedFileContext[]) => void;
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
  showButton?: boolean;
  showList?: boolean;
};

export function FileUpload({
  files,
  onFilesAdded,
  onRemoveFile,
  disabled,
  showButton = true,
  showList = true,
}: FileUploadProps) {
  const [error, setError] = useState("");

  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length || disabled) return;

    setError("");

    try {
      const formData = new FormData();
      Array.from(fileList).forEach((file) => formData.append("files", file));

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      onFilesAdded(data.files ?? []);
      setError("");
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    }
  }

  return (
    <div className="space-y-3">
      {showButton && (
        <label className="inline-flex cursor-pointer rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-paper-dim hover:text-paper">
          Upload
          <input
            type="file"
            multiple
            disabled={disabled}
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
      )}

      {error && (
        <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
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
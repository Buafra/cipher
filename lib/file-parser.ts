import AdmZip from "adm-zip";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

export type ParsedUpload = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: string;
  text: string;
  extracted: boolean;
  note?: string;
};

const MAX_CONTEXT_CHARS = 60_000;

function trimForContext(text: string) {
  const clean = text.replace(/\r/g, "").trim();
  if (clean.length <= MAX_CONTEXT_CHARS) return clean;
  return clean.slice(0, MAX_CONTEXT_CHARS) + "\n\n[Trimmed for chat context]";
}

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function detectKind(fileName: string, mimeType: string) {
  const ext = getExtension(fileName);

  if (ext === "pdf" || mimeType.includes("pdf")) return "pdf";
  if (ext === "docx") return "docx";
  if (["xlsx", "xls"].includes(ext)) return "spreadsheet";
  if (ext === "csv") return "csv";
  if (ext === "pptx") return "pptx";
  if (ext === "zip") return "zip";
  if (["txt", "md", "json", "html", "htm", "xml", "log"].includes(ext)) return "text";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  if (["mp3", "wav", "m4a"].includes(ext)) return "audio";
  if (["mp4", "mov"].includes(ext)) return "video";

  return "unknown";
}

async function parseText(buffer: Buffer) {
  return trimForContext(buffer.toString("utf8"));
}

async function parsePdf(buffer: Buffer) {
  try {
   const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const result = await pdfParse(buffer);
    const text = trimForContext(result.text ?? "");

    if (!text) {
      return {
        text: "",
        extracted: false,
        note: "PDF uploaded, but no selectable text was extracted. It may be scanned/image-based and needs OCR.",
      };
    }

    return { text, extracted: true };
  } catch (error: any) {
    return {
      text: "",
      extracted: false,
      note: `PDF extraction failed: ${error?.message ?? "Unknown PDF parser error"}`,
    };
  }
}

async function parseDocx(buffer: Buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = trimForContext(result.value ?? "");

    return {
      text,
      extracted: Boolean(text),
      note: text ? undefined : "DOCX uploaded, but no readable text was extracted.",
    };
  } catch (error: any) {
    return {
      text: "",
      extracted: false,
      note: `DOCX extraction failed: ${error?.message ?? "Unknown DOCX parser error"}`,
    };
  }
}

async function parseSpreadsheet(buffer: Buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const parts: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      parts.push(`Sheet: ${sheetName}\n${csv}`);
    }

    const text = trimForContext(parts.join("\n\n---\n\n"));

    return {
      text,
      extracted: Boolean(text),
      note: text ? undefined : "Spreadsheet uploaded, but no readable cells were extracted.",
    };
  } catch (error: any) {
    return {
      text: "",
      extracted: false,
      note: `Spreadsheet extraction failed: ${error?.message ?? "Unknown spreadsheet parser error"}`,
    };
  }
}

async function parsePptx(buffer: Buffer) {
  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    const slideEntries = entries
      .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName))
      .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }));

    const slides: string[] = [];

    for (const entry of slideEntries) {
      const xml = entry.getData().toString("utf8");
      const matches = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/g)]
        .map((m) =>
          m[1]
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
        )
        .filter(Boolean);

      if (matches.length) {
        slides.push(`${entry.entryName.replace("ppt/slides/", "")}\n${matches.join("\n")}`);
      }
    }

    const text = trimForContext(slides.join("\n\n---\n\n"));

    return {
      text,
      extracted: Boolean(text),
      note: text ? undefined : "PPTX uploaded, but no slide text was extracted.",
    };
  } catch (error: any) {
    return {
      text: "",
      extracted: false,
      note: `PPTX extraction failed: ${error?.message ?? "Unknown PPTX parser error"}`,
    };
  }
}

async function parseZip(buffer: Buffer) {
  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    const readable: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const name = entry.entryName;
      const ext = getExtension(name);

      if (["txt", "md", "json", "csv", "html", "htm", "xml", "log"].includes(ext)) {
        readable.push(`File: ${name}\n${entry.getData().toString("utf8")}`);
      }
    }

    const text = trimForContext(readable.join("\n\n---\n\n"));

    return {
      text,
      extracted: Boolean(text),
      note: text
        ? "ZIP extracted text-based files only. Binary files inside the ZIP were skipped."
        : "ZIP uploaded, but no readable text files were found inside.",
    };
  } catch (error: any) {
    return {
      text: "",
      extracted: false,
      note: `ZIP extraction failed: ${error?.message ?? "Unknown ZIP parser error"}`,
    };
  }
}

export async function parseUploadedFile(file: File): Promise<ParsedUpload> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const kind = detectKind(file.name, file.type);

  let parsed: { text: string; extracted: boolean; note?: string };

  if (kind === "pdf") {
    parsed = await parsePdf(buffer);
  } else if (kind === "docx") {
    parsed = await parseDocx(buffer);
  } else if (kind === "spreadsheet" || kind === "csv") {
    parsed = await parseSpreadsheet(buffer);
  } else if (kind === "pptx") {
    parsed = await parsePptx(buffer);
  } else if (kind === "zip") {
    parsed = await parseZip(buffer);
  } else if (kind === "text") {
    const text = await parseText(buffer);
    parsed = {
      text,
      extracted: Boolean(text),
      note: text ? undefined : "Text file uploaded, but it appears empty.",
    };
  } else if (kind === "image") {
    parsed = {
      text: "",
      extracted: false,
      note: "Image uploaded. OCR/vision analysis is not connected yet.",
    };
  } else if (kind === "audio") {
    parsed = {
      text: "",
      extracted: false,
      note: "Audio uploaded. Transcription is not connected yet.",
    };
  } else if (kind === "video") {
    parsed = {
      text: "",
      extracted: false,
      note: "Video uploaded. Transcription/video analysis is not connected yet.",
    };
  } else {
    parsed = {
      text: "",
      extracted: false,
      note: "Unsupported or unknown file type.",
    };
  }

  return {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    kind,
    text: parsed.text,
    extracted: parsed.extracted,
    note: parsed.note,
  };
}

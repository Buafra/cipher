import type { ExtractedMemoryFact } from "./types";
import { reason } from "@/lib/claude";

export async function extractMemoryFacts(input: {
  text: string;
  source?: string;
}): Promise<ExtractedMemoryFact[]> {
  const text = input.text.trim();
  if (!text) return [];

  const system = `
You are Cipher's Memory Learning Engine.

Extract only useful long-term memory facts from the document.

Return ONLY valid JSON array.
No markdown.
No explanation.

Allowed types:
profile, project, decision, travel, health, finance, general

Each item must be:
{
  "type": "profile | project | decision | travel | health | finance | general",
  "title": "short label",
  "value": "clear memory fact",
  "source": "document source",
  "confidence": 0.1 to 1
}

Rules:
- Do not invent facts.
- Ignore temporary or useless information.
- Extract facts that may be useful later.
- For health facts, be conservative.
- For decisions, include the decision clearly.
`;

  const user = `
Source: ${input.source ?? "manual-input"}

Document:
${text.slice(0, 12000)}
`;

  const response = await reason(system, [{ role: "user", content: user }], 1200);

  try {
    const parsed = JSON.parse(response);

    if (!Array.isArray(parsed) || parsed.length === 0) {
  return [
    {
      type: "general",
      title: "Document Learning Note",
      value: text.slice(0, 500),
      source: input.source,
      confidence: 0.6,
    },
  ];
}

return parsed.map((item) => ({
  type: item.type ?? "general",
  title: item.title ?? "Untitled Fact",
  value: item.value ?? "",
  source: item.source ?? input.source,
  confidence: Number(item.confidence ?? 0.6),
}));
  } catch {
    return [
      {
        type: "general",
        title: "Document Summary",
        value: text.slice(0, 500),
        source: input.source,
        confidence: 0.5,
      },
    ];
  }
}
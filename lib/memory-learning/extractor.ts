import type { ExtractedMemoryFact } from "./types";

export async function extractMemoryFacts(input: {
  text: string;
  source?: string;
}): Promise<ExtractedMemoryFact[]> {
  const text = input.text.trim();

  if (!text) return [];

  return [
    {
      type: "general",
      title: "Document Summary",
      value: text.slice(0, 500),
      source: input.source,
      confidence: 0.7,
    },
  ];
}
import type { ExtractedMemoryFact, MemoryChange } from "./types";

export async function compareWithExistingMemory(input: {
  facts: ExtractedMemoryFact[];
  existingMemories?: string[];
}): Promise<MemoryChange[]> {
  const existing = input.existingMemories ?? [];

  return input.facts.map((fact) => {
    const duplicate = existing.find((memory) =>
      memory.toLowerCase().includes(fact.value.toLowerCase())
    );

    if (duplicate) {
      return {
        changeType: "duplicate",
        fact,
        existingMemory: duplicate,
        recommendation: "Ignore duplicate memory.",
      };
    }

    return {
      changeType: "new",
      fact,
      recommendation: "Review and approve as new memory.",
    };
  });
}
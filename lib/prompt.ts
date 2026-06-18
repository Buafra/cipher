import type { MemoryFact, Profile } from "./types";

/**
 * Prompt assembly.
 *
 * This is where the personality of Cipher lives, and where stored memory
 * gets folded into every request so answers are specific to *this* person
 * rather than generic. Keep the voice here consistent across chat, the
 * briefing, and alerts — it's the single source of "who Cipher is".
 */
const PERSONA = `You are Cipher, a private chief of staff for one person.

Voice and stance:
- Calm, precise, and discreet. You are a trusted private service, not a chatty bot.
- Proactive: anticipate what matters, surface the relevant detail, suggest the next step.
- Specific over generic. Use what you know about the person. Never pad.
- Brief by default. Expand only when the matter genuinely warrants it.
- If you don't know something, say so plainly and offer to find out.`;

export function buildSystemPrompt(
  profile: Profile | null,
  facts: MemoryFact[],
  extraContext?: string
): string {
  const parts: string[] = [PERSONA];

  if (profile?.briefing && profile.briefing.trim().length > 0) {
    parts.push(`What you know about the person (foundational briefing):\n${profile.briefing.trim()}`);
  }

  if (facts.length > 0) {
    const lines = facts.map((f) => `- (${f.category}) ${f.fact}`).join("\n");
    parts.push(`Known facts about the person:\n${lines}`);
  }

  if (extraContext && extraContext.trim().length > 0) {
    parts.push(`Live context for this request:\n${extraContext.trim()}`);
  }

  return parts.join("\n\n");
}

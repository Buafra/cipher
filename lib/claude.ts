import Anthropic from "@anthropic-ai/sdk";

/**
 * Layer 3 — Intelligence.
 *
 * A thin wrapper around the Claude API. Everything that needs reasoning
 * (chat, the daily briefing, trigger summaries) goes through here, so
 * there is exactly one place that holds the credential and one place to
 * change models or add rules. This is the "relay" idea from doc §5.
 */
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error("Missing ANTHROPIC_API_KEY in .env.local");
}

const client = new Anthropic({ apiKey });

const MODEL = process.env.CIPHER_MODEL ?? "claude-sonnet-4-6";

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * Reason over a system prompt + conversation and return plain text.
 * Used by chat, the briefing job, and trigger summaries.
 */
export async function reason(
  system: string,
  messages: ChatTurn[],
  maxTokens = 1024
): Promise<string> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  // Join any text blocks the model returned.
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

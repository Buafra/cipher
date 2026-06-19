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

export type ReasonOptions = {
  /** Let Claude search the web for current info when the question needs it. */
  webSearch?: boolean;
  /** Cap searches per message to bound cost. Default 3. */
  maxSearches?: number;
};

/**
 * Reason over a system prompt + conversation and return plain text.
 * Used by chat, the briefing job, and trigger summaries.
 *
 * When opts.webSearch is true, Claude is given Anthropic's server-side web
 * search tool. Claude decides on its own whether a given message actually
 * needs a search, runs it on Anthropic's servers, and folds the results into
 * its answer — so we still just read back the final text. Searches bill as an
 * add-on, which is why it's opt-in per call and capped.
 */
export async function reason(
  system: string,
  messages: ChatTurn[],
  maxTokens = 1024,
  opts: ReasonOptions = {}
): Promise<string> {
  const tools = opts.webSearch
    ? [
        {
          // Current web search tool version. If your account/SDK rejects it,
          // fall back to "web_search_20250305".
          type: "web_search_20260209",
          name: "web_search",
          max_uses: opts.maxSearches ?? 3,
        },
      ]
    : undefined;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    // Cast: older SDK type defs may not list this server tool, but the API
    // accepts it. The cast keeps TypeScript happy without a version bump.
    ...(tools ? { tools: tools as any } : {}),
  });

  // Join any text blocks the model returned (ignores search-result blocks).
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

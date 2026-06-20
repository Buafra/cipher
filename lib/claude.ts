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

export const MODEL = process.env.CIPHER_MODEL ?? "claude-sonnet-4-6";
export const PROVIDER = "Anthropic";

export function modelDisplayName(model = MODEL) {
  const normalized = model.toLowerCase();

  if (normalized.includes("opus")) return "Claude Opus";
  if (normalized.includes("sonnet")) return "Claude Sonnet";
  if (normalized.includes("haiku")) return "Claude Haiku";

  return model;
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type ReasonOptions = {
  /** Let Claude search the web for current info when the question needs it. */
  webSearch?: boolean;
  /** Cap searches per message to bound cost. Default 3. */
  maxSearches?: number;
};

export type ReasonResult = {
  text: string;
  modelUsed: string;
  modelDisplayName: string;
  provider: string;
  webSearchEnabled: boolean;
};

function buildTools(opts: ReasonOptions) {
  return opts.webSearch
    ? [
        {
          type: "web_search_20260209",
          name: "web_search",
          max_uses: opts.maxSearches ?? 3,
        },
      ]
    : undefined;
}

function cleanChatMessages(messages: ChatTurn[]) {
  const cleanMessages = (messages ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role,
      content: m.content.trim(),
    }));

  if (cleanMessages.length === 0) {
    cleanMessages.push({
      role: "user",
      content: "Hello",
    });
  }

  return cleanMessages;
}

/**
 * Detailed reasoning result for chat routes that need metadata.
 * Keeps model/provider/search status visible to the frontend without changing
 * the existing plain-text reason() function used elsewhere.
 */
export async function reasonDetailed(
  system: string,
  messages: ChatTurn[],
  maxTokens = 1024,
  opts: ReasonOptions = {}
): Promise<ReasonResult> {
  const tools = buildTools(opts);
  const cleanMessages = cleanChatMessages(messages);

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: cleanMessages,
    ...(tools ? { tools: tools as any } : {}),
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return {
    text,
    modelUsed: MODEL,
    modelDisplayName: modelDisplayName(MODEL),
    provider: PROVIDER,
    webSearchEnabled: Boolean(opts.webSearch),
  };
}

/**
 * Backward-compatible plain text helper.
 * Used by briefing jobs and any older code that expects Promise<string>.
 */
export async function reason(
  system: string,
  messages: ChatTurn[],
  maxTokens = 1024,
  opts: ReasonOptions = {}
): Promise<string> {
  const result = await reasonDetailed(system, messages, maxTokens, opts);
  return result.text;
}

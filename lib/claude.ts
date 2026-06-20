import { modelDisplayName, routeReasoning, type ChatTurn, type ReasonOptions, type ReasonResult } from "@/lib/model-router";

export { modelDisplayName };
export type { ChatTurn, ReasonOptions, ReasonResult };

export const MODEL = process.env.CIPHER_MODEL ?? process.env.CIPHER_CLAUDE_SONNET_MODEL ?? "claude-sonnet-4-6";
export const PROVIDER = "Anthropic";

/**
 * Backward-compatible detailed helper for older Cipher code.
 * Main chat routing should use lib/model-router.ts directly.
 */
export async function reasonDetailed(
  system: string,
  messages: ChatTurn[],
  maxTokens = 1024,
  opts: ReasonOptions & { model?: string } = {}
): Promise<ReasonResult> {
  const selectedModel = opts.selectedModel ?? (opts.model ? modelDisplayName(opts.model) : "Claude Sonnet");
  return routeReasoning(system, messages, maxTokens, {
    selectedModel,
    webSearch: opts.webSearch,
    maxSearches: opts.maxSearches,
  });
}

/** Backward-compatible plain text helper. */
export async function reason(
  system: string,
  messages: ChatTurn[],
  maxTokens = 1024,
  opts: ReasonOptions = {}
): Promise<string> {
  const result = await reasonDetailed(system, messages, maxTokens, opts);
  return result.text;
}

import Anthropic from "@anthropic-ai/sdk";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type CipherModelChoice =
  | "Auto"
  | "Claude Sonnet"
  | "Claude Opus"
  | "OpenAI ChatGPT"
  | "Gemini Pro"
  | "Gemini Flash"
  | "OpenRouter Auto"
  | "Qwen Main"
  | "Gemma General"
  | "Qwen Coder"
  | "DeepSeek Code"
  | "Mistral Chat"
  | "Phi Fast";

export type ReasonOptions = {
  selectedModel?: string;
  webSearch?: boolean;
  maxSearches?: number;
};

export type ReasonResult = {
  text: string;
  modelUsed: string;
  modelDisplayName: string;
  provider: string;
  selectedModel: string;
  routedModel: string;
  webSearchEnabled: boolean;
};

export type ModelRoute = {
  selectedModel: string;
  provider: "Anthropic" | "OpenAI" | "Google" | "OpenRouter" | "Ollama" | "Cipher";
  modelId: string;
  modelDisplayName: string;
  routedModel: string;
  kind: "anthropic" | "openai" | "gemini" | "openrouter" | "ollama" | "unsupported";
};

const DEFAULT_CLAUDE_SONNET = process.env.CIPHER_CLAUDE_SONNET_MODEL ?? process.env.CIPHER_MODEL ?? "claude-sonnet-4-6";
const DEFAULT_CLAUDE_OPUS = process.env.CIPHER_CLAUDE_OPUS_MODEL ?? "claude-opus-4-5";
const DEFAULT_OPENAI = process.env.OPENAI_MODEL ?? "gpt-5.5";
const DEFAULT_GEMINI_PRO = process.env.GEMINI_PRO_MODEL ?? "gemini-2.5-pro";
const DEFAULT_GEMINI_FLASH = process.env.GEMINI_FLASH_MODEL ?? "gemini-2.5-flash";
const DEFAULT_OPENROUTER = process.env.OPENROUTER_MODEL ?? "openrouter/auto";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

function normalizeChoice(choice?: string) {
  return (choice && choice.trim()) || "Auto";
}

export function modelDisplayName(model: string) {
  const normalized = model.toLowerCase();

  if (normalized.includes("opus")) return "Claude Opus";
  if (normalized.includes("sonnet")) return "Claude Sonnet";
  if (normalized.includes("haiku")) return "Claude Haiku";
  if (normalized.includes("gemini") && normalized.includes("flash")) return "Gemini Flash";
  if (normalized.includes("gemini")) return "Gemini Pro";
  if (normalized.includes("gpt")) return "OpenAI ChatGPT";
  if (normalized.includes("qwen") && normalized.includes("coder")) return "Qwen Coder";
  if (normalized.includes("qwen")) return "Qwen Main";
  if (normalized.includes("deepseek")) return "DeepSeek Code";
  if (normalized.includes("gemma")) return "Gemma General";
  if (normalized.includes("mistral")) return "Mistral Chat";
  if (normalized.includes("phi")) return "Phi Fast";

  return model;
}

function localModelForChoice(choice: string) {
  switch (choice) {
    case "Qwen Main":
      return process.env.OLLAMA_QWEN_MAIN_MODEL ?? "qwen3:14b";
    case "Gemma General":
      return process.env.OLLAMA_GEMMA_MODEL ?? "gemma3:12b";
    case "Qwen Coder":
      return process.env.OLLAMA_QWEN_CODER_MODEL ?? "qwen3-coder";
    case "DeepSeek Code":
      return process.env.OLLAMA_DEEPSEEK_MODEL ?? "deepseek-coder-v2";
    case "Mistral Chat":
      return process.env.OLLAMA_MISTRAL_MODEL ?? "mistral-small";
    case "Phi Fast":
      return process.env.OLLAMA_PHI_MODEL ?? "phi4-mini";
    default:
      return process.env.OLLAMA_DEFAULT_MODEL ?? "qwen3:14b";
  }
}

export function resolveModelRoute(selectedModel?: string): ModelRoute {
  const choice = normalizeChoice(selectedModel);

  if (choice === "Auto" || choice === "Claude Sonnet") {
    return {
      selectedModel: choice,
      provider: "Anthropic",
      modelId: DEFAULT_CLAUDE_SONNET,
      modelDisplayName: "Claude Sonnet",
      routedModel: `${choice === "Auto" ? "Auto → " : ""}Claude Sonnet via Anthropic`,
      kind: "anthropic",
    };
  }

  if (choice === "Claude Opus") {
    return {
      selectedModel: choice,
      provider: "Anthropic",
      modelId: DEFAULT_CLAUDE_OPUS,
      modelDisplayName: "Claude Opus",
      routedModel: "Claude Opus via Anthropic",
      kind: "anthropic",
    };
  }

  if (choice === "OpenAI ChatGPT") {
    return {
      selectedModel: choice,
      provider: "OpenAI",
      modelId: DEFAULT_OPENAI,
      modelDisplayName: "OpenAI ChatGPT",
      routedModel: "OpenAI ChatGPT via OpenAI",
      kind: "openai",
    };
  }

  if (choice === "Gemini Pro") {
    return {
      selectedModel: choice,
      provider: "Google",
      modelId: DEFAULT_GEMINI_PRO,
      modelDisplayName: "Gemini Pro",
      routedModel: "Gemini Pro via Google",
      kind: "gemini",
    };
  }

  if (choice === "Gemini Flash") {
    return {
      selectedModel: choice,
      provider: "Google",
      modelId: DEFAULT_GEMINI_FLASH,
      modelDisplayName: "Gemini Flash",
      routedModel: "Gemini Flash via Google",
      kind: "gemini",
    };
  }

  if (choice === "OpenRouter Auto") {
    return {
      selectedModel: choice,
      provider: "OpenRouter",
      modelId: DEFAULT_OPENROUTER,
      modelDisplayName: "OpenRouter Auto",
      routedModel: "OpenRouter Auto",
      kind: "openrouter",
    };
  }

  if (["Qwen Main", "Gemma General", "Qwen Coder", "DeepSeek Code", "Mistral Chat", "Phi Fast"].includes(choice)) {
    const modelId = localModelForChoice(choice);
    return {
      selectedModel: choice,
      provider: "Ollama",
      modelId,
      modelDisplayName: choice,
      routedModel: `${choice} via Ollama`,
      kind: "ollama",
    };
  }

  return {
    selectedModel: choice,
    provider: "Cipher",
    modelId: "unsupported",
    modelDisplayName: choice,
    routedModel: "Unsupported model route",
    kind: "unsupported",
  };
}

function cleanMessages(messages: ChatTurn[]) {
  const clean = (messages ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content.trim() }));

  return clean.length ? clean : [{ role: "user" as const, content: "Hello" }];
}

function errorResult(route: ModelRoute, message: string, webSearchEnabled: boolean): ReasonResult {
  return {
    text: message,
    modelUsed: route.modelId,
    modelDisplayName: route.modelDisplayName,
    provider: route.provider,
    selectedModel: route.selectedModel,
    routedModel: route.routedModel,
    webSearchEnabled,
  };
}

async function reasonAnthropic(route: ModelRoute, system: string, messages: ChatTurn[], maxTokens: number, opts: ReasonOptions): Promise<ReasonResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return errorResult(route, "Anthropic is selected, but ANTHROPIC_API_KEY is missing.", Boolean(opts.webSearch));

  const client = new Anthropic({ apiKey });
  const tools = opts.webSearch
    ? [{ type: "web_search_20260209", name: "web_search", max_uses: opts.maxSearches ?? 3 }]
    : undefined;

  const res = await client.messages.create({
    model: route.modelId,
    max_tokens: maxTokens,
    system,
    messages: cleanMessages(messages),
    ...(tools ? { tools: tools as any } : {}),
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return {
    text: text || "Anthropic returned an empty response.",
    modelUsed: route.modelId,
    modelDisplayName: route.modelDisplayName,
    provider: route.provider,
    selectedModel: route.selectedModel,
    routedModel: route.routedModel,
    webSearchEnabled: Boolean(opts.webSearch),
  };
}

async function reasonOpenAI(route: ModelRoute, system: string, messages: ChatTurn[], maxTokens: number, opts: ReasonOptions): Promise<ReasonResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return errorResult(route, "OpenAI ChatGPT is selected, but OPENAI_API_KEY is missing.", Boolean(opts.webSearch));

  const input = [
    { role: "developer", content: system },
    ...cleanMessages(messages).map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: route.modelId, input, max_output_tokens: maxTokens }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) return errorResult(route, `OpenAI request failed: ${data?.error?.message ?? response.statusText}`, Boolean(opts.webSearch));

  const text =
    data.output_text ??
    data.output
      ?.flatMap((item: any) => item.content ?? [])
      ?.filter((part: any) => part.type === "output_text" || part.type === "text")
      ?.map((part: any) => part.text)
      ?.join("\n")
      ?.trim() ??
    "";

  return {
    text: text || "OpenAI returned an empty response.",
    modelUsed: route.modelId,
    modelDisplayName: route.modelDisplayName,
    provider: route.provider,
    selectedModel: route.selectedModel,
    routedModel: route.routedModel,
    webSearchEnabled: Boolean(opts.webSearch),
  };
}

async function reasonGemini(route: ModelRoute, system: string, messages: ChatTurn[], maxTokens: number, opts: ReasonOptions): Promise<ReasonResult> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return errorResult(route, `${route.modelDisplayName} is selected, but GEMINI_API_KEY is missing.`, Boolean(opts.webSearch));

  const contents = cleanMessages(messages).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(route.modelId)}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) return errorResult(route, `Gemini request failed: ${data?.error?.message ?? response.statusText}`, Boolean(opts.webSearch));

  const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("\n").trim() ?? "";

  return {
    text: text || "Gemini returned an empty response.",
    modelUsed: route.modelId,
    modelDisplayName: route.modelDisplayName,
    provider: route.provider,
    selectedModel: route.selectedModel,
    routedModel: route.routedModel,
    webSearchEnabled: Boolean(opts.webSearch),
  };
}

async function reasonOpenRouter(route: ModelRoute, system: string, messages: ChatTurn[], maxTokens: number, opts: ReasonOptions): Promise<ReasonResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return errorResult(route, "OpenRouter Auto is selected, but OPENROUTER_API_KEY is missing.", Boolean(opts.webSearch));

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.CIPHER_PUBLIC_URL ?? "http://localhost:3000",
      "X-Title": "Cipher",
    },
    body: JSON.stringify({
      model: route.modelId,
      messages: [{ role: "system", content: system }, ...cleanMessages(messages)],
      max_tokens: maxTokens,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) return errorResult(route, `OpenRouter request failed: ${data?.error?.message ?? response.statusText}`, Boolean(opts.webSearch));

  const text = data.choices?.[0]?.message?.content?.trim?.() ?? "";

  return {
    text: text || "OpenRouter returned an empty response.",
    modelUsed: data.model ?? route.modelId,
    modelDisplayName: route.modelDisplayName,
    provider: route.provider,
    selectedModel: route.selectedModel,
    routedModel: route.routedModel,
    webSearchEnabled: Boolean(opts.webSearch),
  };
}

async function reasonOllama(route: ModelRoute, system: string, messages: ChatTurn[], maxTokens: number, opts: ReasonOptions): Promise<ReasonResult> {
  const response = await fetch(`${OLLAMA_BASE_URL.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: route.modelId,
      stream: false,
      messages: [{ role: "system", content: system }, ...cleanMessages(messages)],
      options: { num_predict: maxTokens },
    }),
  }).catch((err) => ({ ok: false, statusText: err.message, json: async () => ({}) } as Response));

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return errorResult(
      route,
      `${route.modelDisplayName} is selected, but Ollama is not reachable from this server. This works locally when Ollama is running, but Vercel cannot reach your home PC unless you expose a secure endpoint.`,
      Boolean(opts.webSearch)
    );
  }

  const text = data.message?.content?.trim?.() ?? data.response?.trim?.() ?? "";

  return {
    text: text || "Ollama returned an empty response.",
    modelUsed: route.modelId,
    modelDisplayName: route.modelDisplayName,
    provider: route.provider,
    selectedModel: route.selectedModel,
    routedModel: route.routedModel,
    webSearchEnabled: Boolean(opts.webSearch),
  };
}

export async function routeReasoning(system: string, messages: ChatTurn[], maxTokens = 1024, opts: ReasonOptions = {}): Promise<ReasonResult> {
  const route = resolveModelRoute(opts.selectedModel);

  switch (route.kind) {
    case "anthropic":
      return reasonAnthropic(route, system, messages, maxTokens, opts);
    case "openai":
      return reasonOpenAI(route, system, messages, maxTokens, opts);
    case "gemini":
      return reasonGemini(route, system, messages, maxTokens, opts);
    case "openrouter":
      return reasonOpenRouter(route, system, messages, maxTokens, opts);
    case "ollama":
      return reasonOllama(route, system, messages, maxTokens, opts);
    default:
      return errorResult(route, `The selected model (${route.selectedModel}) is not supported yet.`, Boolean(opts.webSearch));
  }
}

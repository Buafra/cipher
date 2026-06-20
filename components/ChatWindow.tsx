"use client";

import { useState, useRef, useEffect } from "react";

type Turn = { role: "user" | "assistant"; content: string };

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

const VOICE_LANG = "en-US";

const MODELS = [
  "Auto",
  "Claude Sonnet",
  "Claude Opus",
  "OpenAI ChatGPT",
  "Gemini Pro",
  "Gemini Flash",
  "OpenRouter Auto",
  "Qwen Main",
  "Gemma General",
  "Qwen Coder",
  "DeepSeek Code",
  "Mistral Chat",
  "Phi Fast",
];

const AGENTS = ["Hermes", "Athena", "Sentinel", "Mosafer", "Wealth", "Atlas"];

export function ChatWindow() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [remembered, setRemembered] = useState<string[]>([]);

  // Phase 1A model controls. These are sent to /api/chat and routed server-side.
  const [selectedModel, setSelectedModel] = useState("Auto");
  const [webSearch, setWebSearch] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState("Hermes");
  const [runtime, setRuntime] = useState({
    modelDisplayName: "Claude Sonnet",
    modelUsed: "claude-sonnet-4-6",
    provider: "Anthropic",
    routedModel: "Auto → Claude Sonnet via Anthropic",
    searchUsed: false,
  });

  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseInputRef = useRef("");

  async function loadConversations() {
    const res = await fetch("/api/chat/conversations", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setConversations(data.conversations ?? []);
  }

  async function loadConversation(id: string) {
    const res = await fetch(`/api/chat/conversation/${id}`, { cache: "no-store" });
    const data = await res.json();

    if (res.ok) {
      setConversationId(data.conversationId);
      setTurns(data.messages ?? []);
    }
  }

  async function loadLatestHistory() {
    const res = await fetch("/api/chat/history", { cache: "no-store" });
    const data = await res.json();

    if (res.ok) {
      setConversationId(data.conversationId ?? undefined);
      setTurns(data.messages ?? []);
    }
  }

  useEffect(() => {
    loadConversations();
    loadLatestHistory();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy]);

  useEffect(() => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null;

    if (!SR) return;

    const recognition = new SR();
    recognition.lang = VOICE_LANG;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      const prefix = baseInputRef.current
        ? baseInputRef.current.trimEnd() + " "
        : "";

      setInput(prefix + transcript);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceError("Microphone blocked. Allow mic access in your browser settings.");
      } else if (event.error === "no-speech") {
        setVoiceError("Didn't catch that — try again.");
      } else {
        setVoiceError("Voice input error. You can still type.");
      }

      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    };
  }, []);

  function toggleListening() {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }

    setVoiceError("");
    baseInputRef.current = input;

    try {
      recognition.start();
      setListening(true);
    } catch {
      // ignore
    }
  }

  function newChat() {
    setTurns([]);
    setConversationId(undefined);
    setInput("");
  }

  async function deleteConversation(id: string) {
    const confirmed = confirm("Delete this chat? This cannot be undone.");
    if (!confirmed) return;

    const res = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deleteId: id }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.error ?? "Failed to delete chat");
      return;
    }

    setConversations(data.conversations ?? []);

    if (conversationId === id) {
      setConversationId(undefined);
      setTurns([]);
    }
  }

  async function send() {
    const message = input.trim();
    if (!message || busy) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    }

    setInput("");
    setTurns((t) => [...t, { role: "user", content: message }]);
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationId,
          selectedModel,
          selectedAgent,
          webSearch,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      setConversationId(data.conversationId);
      setRuntime({
        modelDisplayName: data.modelDisplayName ?? data.modelUsed ?? runtime.modelDisplayName,
        modelUsed: data.modelUsed ?? runtime.modelUsed,
        provider: data.provider ?? runtime.provider,
        routedModel: data.routedModel ?? runtime.routedModel,
        searchUsed: Boolean(data.searchUsed),
      });
      setTurns((t) => [...t, { role: "assistant", content: data.reply }]);
      loadConversations();

      fetch("/api/memory/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: data.conversationId }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.added?.length) {
            setRemembered(d.added.map((f: { fact: string }) => f.fact));
            setTimeout(() => setRemembered([]), 7000);
          }
        })
        .catch(() => {});
    } catch (err: any) {
      setTurns((t) => [
        ...t,
        {
          role: "assistant",
          content: `Couldn't reach the reasoning layer: ${err.message}`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid h-[78vh] w-full grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)_260px]">
      <aside className="glass flex min-h-0 flex-col rounded-3xl p-4">
        <button
          onClick={newChat}
          className="mb-4 w-full rounded-2xl bg-brass px-3 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          New chat
        </button>

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <p className="eyebrow mb-2">Mode</p>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-paper outline-none"
          >
            {MODELS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>

          <button
            onClick={() => setWebSearch((v) => !v)}
            className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-paper-dim transition hover:text-paper"
          >
            <span>Web search</span>
            <span className={webSearch ? "text-emerald-300" : "text-paper-faint"}>
              {webSearch ? "ON" : "OFF"}
            </span>
          </button>
        </div>

        <p className="eyebrow mb-3">Conversations</p>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-paper-faint">No saved chats yet.</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={
                  "group rounded-2xl transition-colors " +
                  (conversationId === c.id
                    ? "bg-white/[0.08]"
                    : "hover:bg-white/[0.05]")
                }
              >
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <button
                    onClick={() => loadConversation(c.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-xs text-paper">
                      {c.title || "Untitled chat"}
                    </div>

                    <div className="mt-1 text-[10px] text-paper-faint">
                      {new Date(c.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteConversation(c.id);
                    }}
                    className="ml-2 rounded-full border border-red-400/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/20"
                    title="Delete chat"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <div className="glass flex min-h-0 flex-col rounded-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b hairline px-5 py-3">
          <div>
            <p className="text-xs text-paper-faint">
              {conversationId ? "Saved conversation" : "New conversation"}
            </p>
            <p className="mt-1 text-[11px] text-paper-faint">
              {selectedAgent} · {selectedModel === "Auto" ? runtime.modelDisplayName : selectedModel} · {selectedModel === "OpenAI ChatGPT" ? "OpenAI" : selectedModel.startsWith("Gemini") ? "Google" : selectedModel === "OpenRouter Auto" ? "OpenRouter" : ["Qwen Main", "Gemma General", "Qwen Coder", "DeepSeek Code", "Mistral Chat", "Phi Fast"].includes(selectedModel) ? "Ollama" : "Anthropic"} · Search {runtime.searchUsed ? "used" : webSearch ? "ready" : "off"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-paper-faint disabled:opacity-60"
              title="File upload will be wired in the next sprint"
            >
              Upload
            </button>
            <button
              type="button"
              onClick={newChat}
              className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-100 hover:bg-blue-500/15"
            >
              New
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {turns.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
              <p className="eyebrow">Cipher Chat</p>
              <h2 className="mt-2 font-display text-2xl font-light text-paper">
                Ask, analyze, remember, and decide.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper-dim">
                Try: “Summarize today’s priorities”, “Remember I prefer aisle seats”, or “What should I focus on this week?”
              </p>
            </div>
          )}

          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "text-right" : "text-left"}>
              <div
                className={
                  t.role === "user"
                    ? "inline-block max-w-[85%] rounded-2xl border border-blue-500/20 bg-blue-600/20 px-4 py-2 text-left text-paper"
                    : "inline-block max-w-[90%] whitespace-pre-line rounded-2xl border border-pink-500/10 bg-white/[0.035] px-5 py-4 font-display text-[1.05rem] font-light leading-relaxed text-paper"
                }
              >
                {t.content}
              </div>
            </div>
          ))}

          {busy && <p className="text-sm text-paper-faint">Cipher is thinking&hellip;</p>}
          <div ref={endRef} />
        </div>

        <div className="border-t hairline p-3">
          {remembered.length > 0 && (
            <div className="mb-2 px-3 text-xs text-brass-soft">
              <span className="eyebrow mr-2">Remembered</span>
              {remembered.join(" · ")}
            </div>
          )}

          {listening && (
            <div className="mb-2 flex items-center gap-2 px-3 text-xs text-accent">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
              Listening… speak now
            </div>
          )}

          {voiceError && (
            <div className="mb-2 px-3 text-xs text-paper-faint">
              {voiceError}
            </div>
          )}

          <div className="flex items-end gap-2">
            {voiceSupported && (
              <button
                onClick={toggleListening}
                disabled={busy}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                title={listening ? "Stop voice input" : "Speak to Cipher"}
                className={
                  "shrink-0 rounded-xl border px-3 py-2 text-sm transition-colors disabled:opacity-40 " +
                  (listening
                    ? "border-accent bg-accent text-ink"
                    : "hairline text-paper-dim hover:text-paper")
                }
              >
                {listening ? "■" : "🎙"}
              </button>
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={listening ? "Listening…" : "Message Cipher"}
              className="flex-1 resize-none rounded-xl bg-white/[0.035] px-4 py-3 text-paper placeholder:text-paper-faint focus:outline-none"
            />

            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="shrink-0 rounded-xl bg-brass px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <aside className="glass hidden min-h-0 flex-col rounded-3xl p-4 xl:flex">
        <p className="eyebrow mb-3">Agents</p>
        <div className="space-y-2">
          {AGENTS.map((agent) => (
            <button
              key={agent}
              onClick={() => setSelectedAgent(agent)}
              className={
                "w-full rounded-2xl border px-3 py-3 text-left text-xs transition " +
                (selectedAgent === agent
                  ? "border-blue-400/30 bg-blue-500/10 text-paper"
                  : "border-white/10 bg-white/[0.025] text-paper-dim hover:text-paper")
              }
            >
              <div className="font-medium">{agent}</div>
              <div className="mt-1 text-[10px] text-paper-faint">
                {agent === "Hermes" ? "General assistant" : "Routing soon"}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="eyebrow">Sources</p>
          <p className="mt-2 text-xs leading-relaxed text-paper-faint">
            Current model: {selectedModel === "Auto" ? runtime.modelDisplayName : selectedModel}. Last route: {runtime.routedModel}. Search status updates after each response.
          </p>
        </div>
      </aside>
    </div>
  );
}

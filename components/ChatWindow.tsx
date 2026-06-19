"use client";

import { useState, useRef, useEffect } from "react";

type Turn = { role: "user" | "assistant"; content: string };

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

const VOICE_LANG = "en-US";

export function ChatWindow() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [remembered, setRemembered] = useState<string[]>([]);

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
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
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

      const prefix = baseInputRef.current ? baseInputRef.current.trimEnd() + " " : "";
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
        body: JSON.stringify({ message, conversationId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      setConversationId(data.conversationId);
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
<div className="grid h-[78vh] w-full grid-cols-1 gap-5 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border hairline bg-ink-raised p-4">
        <button
          onClick={newChat}
          className="mb-4 w-full rounded-lg bg-brass px-3 py-2 text-sm font-medium text-ink"
        >
          New chat
        </button>

        <p className="eyebrow mb-3">Old chats</p>

        <div className="space-y-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-xs text-paper-faint">No saved chats yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className={
                  "block w-full rounded-md px-3 py-2 text-left text-xs transition-colors " +
                  (conversationId === c.id
                    ? "bg-ink text-paper"
                    : "text-paper-dim hover:bg-ink hover:text-paper")
                }
              >
                <div className="truncate">{c.title || "Untitled chat"}</div>
                <div className="mt-1 text-[10px] text-paper-faint">
                  {new Date(c.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <div className="flex flex-col rounded-xl border hairline bg-ink-raised">
        <div className="flex items-center justify-between border-b hairline px-4 py-2">
          <span className="text-xs text-paper-faint">
            {conversationId ? "Saved conversation" : "New conversation"}
          </span>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {turns.length === 0 && (
            <p className="text-sm text-paper-faint">
              Try: &ldquo;Remember I prefer aisle seats&rdquo; or &ldquo;What's on my plate this week?&rdquo;
            </p>
          )}

          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "text-right" : "text-left"}>
              <div
                className={
                  t.role === "user"
                    ? "inline-block max-w-[85%] rounded-2xl bg-ink px-4 py-2 text-left text-paper"
                    : "inline-block max-w-[90%] whitespace-pre-line font-display text-[1.05rem] font-light leading-relaxed text-paper"
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
            <div className="mb-2 flex items-center gap-2 px-3 text-xs text-brass">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brass" />
              Listening… speak now
            </div>
          )}

          {voiceError && <div className="mb-2 px-3 text-xs text-paper-faint">{voiceError}</div>}

          <div className="flex items-end gap-2">
            {voiceSupported && (
              <button
                onClick={toggleListening}
                disabled={busy}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                title={listening ? "Stop voice input" : "Speak to Cipher"}
                className={
                  "shrink-0 rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-40 " +
                  (listening
                    ? "border-brass bg-brass text-ink"
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
              className="flex-1 resize-none bg-transparent px-3 py-2 text-paper placeholder:text-paper-faint focus:outline-none"
            />

            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="shrink-0 rounded-lg bg-brass px-4 py-2 text-sm font-medium text-ink transition-opacity disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useRef, useEffect } from "react";

type Turn = { role: "user" | "assistant"; content: string };

// Language for voice input. Change to e.g. "ar-SA" for Arabic, "ar-EG", etc.
// (You can even make this a dropdown later.)
const VOICE_LANG = "en-US";

export function ChatWindow() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [remembered, setRemembered] = useState<string[]>([]);

  // Voice input state
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseInputRef = useRef(""); // text already typed before dictation started
useEffect(() => {
  async function loadHistory() {
    try {
      const res = await fetch("/api/chat/history", { cache: "no-store" });
      const data = await res.json();

      if (res.ok) {
        setConversationId(data.conversationId ?? undefined);
        setTurns(data.messages ?? []);
      }
    } catch {
      // ignore history load errors
    }
  }

  loadHistory();
}, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy]);

  // Set up the browser's built-in speech recognition once, if available.
  useEffect(() => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) return; // browser doesn't support it — mic button stays hidden

    const recognition = new SR();
    recognition.lang = VOICE_LANG;
    recognition.interimResults = true; // show words as they're spoken
    recognition.continuous = false; // one utterance, then auto-stop

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
        /* ignore */
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
    baseInputRef.current = input; // keep anything already typed
    try {
      recognition.start();
      setListening(true);
    } catch {
      // start() throws if already started; ignore.
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
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setConversationId(data.conversationId);
      setTurns((t) => [...t, { role: "assistant", content: data.reply }]);

      // Phase 1.5: learn durable facts in a separate request (no added latency).
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
        .catch(() => {
          /* extraction is best-effort; never disrupt the chat */
        });
    } catch (err: any) {
      setTurns((t) => [
        ...t,
        { role: "assistant", content: `Couldn't reach the reasoning layer: ${err.message}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[60vh] flex-col rounded-xl border hairline bg-ink-raised">
      <div className="flex items-center justify-between border-b hairline px-4 py-2">
  <span className="text-xs text-paper-faint">
    {conversationId ? "Saved conversation" : "New conversation"}
  </span>

  <button
    onClick={newChat}
    className="text-xs text-paper-faint hover:text-paper"
  >
    New chat
  </button>
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
              {/* simple mic glyph, no icon dependency */}
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
  );
}

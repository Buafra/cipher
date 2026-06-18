"use client";

import { useState, useRef, useEffect } from "react";

type Turn = { role: "user" | "assistant"; content: string };

export function ChatWindow() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [remembered, setRemembered] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy]);

  async function send() {
    const message = input.trim();
    if (!message || busy) return;

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
        <div className="flex items-end gap-2">
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
            placeholder="Message Cipher"
            className="flex-1 resize-none bg-transparent px-3 py-2 text-paper placeholder:text-paper-faint focus:outline-none"
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="rounded-lg bg-brass px-4 py-2 text-sm font-medium text-ink transition-opacity disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

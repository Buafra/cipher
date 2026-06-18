"use client";

import { useState } from "react";
import type { MemoryFact } from "@/lib/types";

export function MemoryEditor({
  initialFacts,
  initialBriefing,
}: {
  initialFacts: MemoryFact[];
  initialBriefing: string;
}) {
  const [facts, setFacts] = useState(initialFacts);
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState("general");
  const [briefing, setBriefing] = useState(initialBriefing);
  const [savedNote, setSavedNote] = useState("");

  async function addFact() {
    const fact = draft.trim();
    if (!fact) return;
    const res = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fact, category }),
    });
    const data = await res.json();
    if (res.ok) {
      setFacts((f) => [...f, data.fact]);
      setDraft("");
    }
  }

  async function removeFact(id: string) {
    const res = await fetch(`/api/memory?id=${id}`, { method: "DELETE" });
    if (res.ok) setFacts((f) => f.filter((x) => x.id !== id));
  }

  async function saveBriefing() {
    // Reuses the memory API pattern; see README Phase 1 notes to add the
    // /api/profile endpoint if you'd rather keep this fully separate.
    const res = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fact: `BRIEFING_UPDATE: ${briefing}`, category: "_briefing" }),
    });
    if (res.ok) {
      setSavedNote("Saved as a memory note. (See README to wire the dedicated profile endpoint.)");
      setTimeout(() => setSavedNote(""), 4000);
    }
  }

  return (
    <div className="space-y-10">
      {/* Add a fact */}
      <div className="rounded-xl border hairline bg-ink-raised p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFact()}
            placeholder="e.g. Prefers morning flights"
            className="flex-1 rounded-lg bg-ink px-3 py-2 text-paper placeholder:text-paper-faint focus:outline-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg bg-ink px-3 py-2 text-paper-dim focus:outline-none"
          >
            <option value="general">General</option>
            <option value="preference">Preference</option>
            <option value="person">Person</option>
            <option value="commitment">Commitment</option>
            <option value="project">Project</option>
          </select>
          <button
            onClick={addFact}
            className="rounded-lg bg-brass px-4 py-2 text-sm font-medium text-ink"
          >
            Add
          </button>
        </div>
      </div>

      {/* Facts list */}
      <div>
        {facts.length === 0 ? (
          <p className="text-sm text-paper-dim">No facts yet. Add the first one above.</p>
        ) : (
          <ul className="divide-y divide-ink-hair">
            {facts.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-4 py-3">
                <span className="text-paper">
                  <span className="mr-2 text-[10px] uppercase tracking-eyebrow text-brass-soft">
                    {f.category}
                  </span>
                  {f.fact}
                </span>
                <button
                  onClick={() => removeFact(f.id)}
                  className="text-xs text-paper-faint hover:text-paper"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Foundational briefing (doc §7) */}
      <div>
        <h2 className="eyebrow mb-2">Foundational briefing</h2>
        <p className="mb-3 text-sm text-paper-dim">
          A one-time, comprehensive note about your life — family, routines, obligations,
          preferences. Referenced everywhere.
        </p>
        <textarea
          value={briefing}
          onChange={(e) => setBriefing(e.target.value)}
          rows={6}
          placeholder="Tell Cipher about your life…"
          className="w-full rounded-lg bg-ink p-3 text-paper placeholder:text-paper-faint focus:outline-none"
        />
        <div className="mt-2 flex items-center gap-3">
          <button onClick={saveBriefing} className="rounded-lg border hairline px-4 py-2 text-sm text-paper">
            Save briefing
          </button>
          {savedNote && <span className="text-xs text-paper-faint">{savedNote}</span>}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Generates today's briefing on demand (POST /api/briefing), then refreshes
 * the page so the new dispatch shows up. Saves waiting for the 6am cron.
 */
export function GenerateBriefing({ label = "Generate today's briefing" }: { label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function run() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/briefing", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={busy}
        className="rounded-lg bg-brass px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
      >
        {busy ? "Writing…" : label}
      </button>
      {error && <p className="mt-2 text-xs text-paper-faint">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";

export default function RefreshBriefingButton() {
  const [loading, setLoading] = useState(false);

  async function refreshBriefing() {
    try {
      setLoading(true);
      await fetch("/api/morning-sync", { cache: "no-store" });
      window.location.reload();
    } catch (error) {
      console.error("Failed to refresh briefing", error);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={refreshBriefing}
      disabled={loading}
      className="rounded-full border border-brass px-4 py-2 text-sm text-brass hover:bg-brass hover:text-ink disabled:opacity-50"
    >
      {loading ? "Refreshing..." : "Refresh Briefing"}
    </button>
  );
}

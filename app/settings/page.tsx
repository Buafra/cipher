import { Eyebrow } from "@/components/Card";
import { MemoryEditor } from "@/components/MemoryEditor";
import { loadMemory, loadProfile } from "@/lib/memory";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [facts, profile] = await Promise.all([loadMemory(), loadProfile()]);

  return (
    <div className="space-y-8">
      <div>
        <Eyebrow>Memory</Eyebrow>
        <h1 className="font-display text-2xl font-light text-paper">What Cipher knows</h1>
        <p className="mt-1 text-sm text-paper-dim">
          The facts below are folded into every response. This is what makes Cipher specific to you.
        </p>
      </div>
      <MemoryEditor initialFacts={facts} initialBriefing={profile?.briefing ?? ""} />
    </div>
  );
}

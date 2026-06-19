import { Eyebrow, Card } from "@/components/Card";

export default function MemoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Memory</Eyebrow>

        <h1 className="font-display text-2xl font-light text-paper">
          Cipher Memory
        </h1>

        <p className="mt-1 text-sm text-paper-dim">
          Read-only view of what Cipher knows. Scaffolded only.
        </p>
      </div>

      <Card>
        <div className="space-y-3 text-sm text-paper-dim">
          <p>Profile briefing: Not loaded</p>
          <p>Known facts: Not loaded</p>
          <p>Preferences: Not loaded</p>
          <p>Recent memory: Not loaded</p>
        </div>
      </Card>
    </div>
  );
}
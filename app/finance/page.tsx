import { Eyebrow, Card } from "@/components/Card";

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Phase 3</Eyebrow>
        <h1 className="font-display text-2xl font-light text-paper">Finance</h1>
        <p className="mt-1 text-sm text-paper-dim">
          Price watches and threshold alerts. Scaffolded, not yet wired.
        </p>
      </div>
      <Card>
        <p className="text-paper-dim">To build this phase:</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-paper-dim">
          <li>Pick a price source (e.g. a free stock/crypto quote API) and add the key to <code className="text-brass">.env.local</code>.</li>
          <li>Add a <code className="text-brass">fetchPrice(symbol)</code> helper in <code className="text-brass">lib/</code>.</li>
          <li>Uncomment the finance block in <code className="text-brass">app/api/cron/triggers/route.ts</code>.</li>
          <li>Build an editor here for the <code className="text-brass">finance_watches</code> table (mirror MemoryEditor).</li>
        </ol>
        <p className="mt-4 text-sm text-paper-dim">
          The database table and the briefing's data-gathering hook already exist — you're only adding the price feed and this screen.
        </p>
      </Card>
    </div>
  );
}

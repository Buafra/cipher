import { Eyebrow, Card } from "@/components/Card";
import { loadMemory, loadProfile } from "@/lib/memory";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function MemoryPage() {
  const [profile, facts] = await Promise.all([
    loadProfile(),
    loadMemory(),
  ]);

  const recentFacts = [...facts].reverse().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Memory</Eyebrow>

        <h1 className="font-display text-2xl font-light text-paper">
          Cipher Memory
        </h1>

        <p className="mt-1 text-sm text-paper-dim">
          Read-only view of what Cipher knows.
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-medium text-paper">Profile Briefing</h2>

        <p className="mt-3 whitespace-pre-wrap text-sm text-paper-dim">
          {profile?.briefing?.trim() || "No profile briefing saved."}
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-paper">Known Facts</h2>
          <span className="text-sm text-paper-dim">{facts.length} facts</span>
        </div>

        <div className="mt-4 space-y-3">
          {recentFacts.length > 0 ? (
            recentFacts.map((fact) => (
              <div
                key={fact.id}
                className="rounded-xl border border-white/10 p-3"
              >
                <div className="mb-1 flex items-center justify-between text-xs text-paper-dim">
                  <span>{fact.category}</span>
                  <span>{fact.source}</span>
                </div>

                <p className="text-sm text-paper">{fact.fact}</p>
<p className="mt-1 text-xs text-paper-dim">
  ID: {fact.id}
</p>
                <p className="mt-2 text-xs text-paper-dim">
                  {new Date(fact.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-paper-dim">No memory facts saved.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
import { Eyebrow, Card } from "@/components/Card";
import { loadMemory, loadProfile } from "@/lib/memory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MemoryPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const [profile, facts] = await Promise.all([
    loadProfile(),
    loadMemory(),
  ]);

  const query = searchParams?.q?.toLowerCase().trim() || "";

  const visibleFacts = [...facts]
    .reverse()
    .filter((fact) => {
      if (!query) return true;

      return (
        fact.fact.toLowerCase().includes(query) ||
        fact.category.toLowerCase().includes(query) ||
        fact.source.toLowerCase().includes(query)
      );
    })
    .slice(0, 20);

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

          <span className="text-sm text-paper-dim">
            {visibleFacts.length} shown / {facts.length} total
          </span>
        </div>

        <form className="mt-4" action="/memory">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search memory..."
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-paper outline-none placeholder:text-paper-dim"
          />
        </form>

        <div className="mt-4 space-y-3">
          {visibleFacts.length > 0 ? (
            visibleFacts.map((fact) => (
              <div
                key={fact.id}
                className="rounded-xl border border-white/10 p-3"
              >
                <div className="mb-1 flex items-center justify-between text-xs text-paper-dim">
                  <span>{fact.category}</span>
                  <span>{fact.source}</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-paper">{fact.fact}</p>

                    <p className="mt-1 text-xs text-paper-dim">
                      ID: {fact.id}
                    </p>

                    <p className="mt-2 text-xs text-paper-dim">
                      {new Date(fact.created_at).toLocaleString()}
                    </p>
                  </div>

                  <a
                    href={`/api/memory/delete?id=${fact.id}`}
                    className="rounded-md border border-red-500 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </a>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-paper-dim">No matching memory facts.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
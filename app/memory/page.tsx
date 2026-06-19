import { Eyebrow, Card } from "@/components/Card";
import { loadMemory, loadProfile } from "@/lib/memory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MemoryPage({
  searchParams,
}: {
  searchParams?: { q?: string; category?: string };
}) {
  const [profile, facts] = await Promise.all([loadProfile(), loadMemory()]);

  const query = searchParams?.q?.toLowerCase().trim() || "";
  const selectedCategory = searchParams?.category?.toLowerCase().trim() || "all";

  const briefingFacts = facts.filter((f) => f.category === "_briefing");
  const visibleMemory = facts.filter((f) => f.category !== "_briefing");

  const categories = Array.from(
    new Set(visibleMemory.map((f) => f.category))
  ).sort();

  const filteredFacts = [...visibleMemory]
    .reverse()
    .filter((fact) => {
      const matchesQuery =
        !query ||
        fact.fact.toLowerCase().includes(query) ||
        fact.category.toLowerCase().includes(query) ||
        fact.source.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "all" ||
        fact.category.toLowerCase() === selectedCategory;

      return matchesQuery && matchesCategory;
    })
    .slice(0, 50);

  const inferredCount = visibleMemory.filter(
    (f) => f.source === "inferred"
  ).length;

  const userCount = visibleMemory.filter((f) => f.source === "user").length;
  const latestBriefing = [...briefingFacts].reverse()[0];

  const buildCategoryHref = (category: string) => {
    const params = new URLSearchParams();

    if (query) params.set("q", query);
    if (category !== "all") params.set("category", category);

    const qs = params.toString();
    return qs ? `/memory?${qs}` : "/memory";
  };

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Memory</Eyebrow>

        <h1 className="font-display text-2xl font-light text-paper">
          Cipher Memory
        </h1>

        <p className="mt-1 text-sm text-paper-dim">
          Search, review, and clean stored memory. Read-only except delete.
        </p>
      </div>

      <Card>
        <div className="grid gap-3 text-sm text-paper-dim md:grid-cols-4">
          <div>
            <p className="text-paper">Known Facts</p>
            <p>{visibleMemory.length}</p>
          </div>

          <div>
            <p className="text-paper">User Facts</p>
            <p>{userCount}</p>
          </div>

          <div>
            <p className="text-paper">Inferred Facts</p>
            <p>{inferredCount}</p>
          </div>

          <div>
            <p className="text-paper">Categories</p>
            <p>{categories.length}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-paper">Profile Briefing</h2>

        <p className="mt-3 whitespace-pre-wrap text-sm text-paper-dim">
          {profile?.briefing?.trim() || "No profile briefing saved."}
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-paper">Briefing Memory</h2>
            <p className="mt-1 text-xs text-paper-dim">
              Long briefing records are hidden here to keep the page clean.
            </p>
          </div>

          <span className="text-sm text-paper-dim">
            {briefingFacts.length} records
          </span>
        </div>

        {latestBriefing ? (
          <div className="mt-4 rounded-xl border border-white/10 p-3">
            <p className="text-sm text-paper-dim">
              Briefing memory is saved. Full text hidden from this view.
            </p>

            <p className="mt-2 text-xs text-paper-dim">
              ID: {latestBriefing.id}
            </p>

            <p className="mt-1 text-xs text-paper-dim">
              {new Date(latestBriefing.created_at).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-paper-dim">
            No briefing memory saved.
          </p>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium text-paper">Known Facts</h2>

          <span className="text-sm text-paper-dim">
            {filteredFacts.length} shown / {visibleMemory.length} total
          </span>
        </div>

        <form className="mt-4 flex gap-2" action="/memory">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search memory..."
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-paper outline-none placeholder:text-paper-dim"
          />

          {selectedCategory !== "all" && (
            <input type="hidden" name="category" value={selectedCategory} />
          )}

          <button
            type="submit"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-paper-dim hover:bg-white/5"
          >
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={buildCategoryHref("all")}
            className={
              selectedCategory === "all"
                ? "rounded-full border border-brass px-3 py-1 text-xs text-brass"
                : "rounded-full border border-white/10 px-3 py-1 text-xs text-paper-dim hover:bg-white/5"
            }
          >
            All
          </a>

          {categories.map((category) => (
            <a
              key={category}
              href={buildCategoryHref(category)}
              className={
                selectedCategory === category.toLowerCase()
                  ? "rounded-full border border-brass px-3 py-1 text-xs text-brass"
                  : "rounded-full border border-white/10 px-3 py-1 text-xs text-paper-dim hover:bg-white/5"
              }
            >
              {category}
            </a>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {filteredFacts.length > 0 ? (
            filteredFacts.map((fact) => (
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
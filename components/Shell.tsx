import Link from "next/link";

/**
 * The frame every page sits in: a quiet left rail with the wordmark and
 * the top-level sections from doc §3. Phases that aren't built yet are
 * shown but marked, so the shape of the whole system is visible from day one.
 */
const NAV = [
  { href: "/", label: "Home", phase: 1 },
  { href: "/chat", label: "Chat", phase: 1 },
  { href: "/settings", label: "Memory", phase: 1 },
  { href: "/finance", label: "Finance", phase: 3 },
  { href: "/health", label: "Health", phase: 4 },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r hairline px-6 py-8">
        <div className="wordmark text-lg text-paper">Cipher</div>
        <p className="mt-1 text-xs text-paper-faint">Private chief of staff</p>

        <nav className="mt-12 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between rounded-md px-3 py-2 text-sm text-paper-dim transition-colors hover:bg-ink-raised hover:text-paper"
            >
              <span>{item.label}</span>
              {item.phase > 1 && (
                <span className="text-[10px] text-paper-faint">soon</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-8 text-[11px] text-paper-faint">
          Watching quietly.
        </div>
      </aside>

      <main className="flex-1 px-6 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-reading">{children}</div>
      </main>
    </div>
  );
}

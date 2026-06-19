import Link from "next/link";

const NAV = [
  { href: "/", label: "Home", phase: 1 },
  { href: "/chat", label: "Chat", phase: 1 },
  { href: "/tasks", label: "Tasks", phase: 1 },
  { href: "/settings", label: "Memory", phase: 1 },
  { href: "/finance", label: "Finance", phase: 3 },
  { href: "/health", label: "Health", phase: 4 },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 flex-col px-5 py-5 md:flex">
          <div className="glass flex h-full flex-col rounded-3xl px-5 py-6">
            <div>
              <div className="wordmark text-lg text-white">Cipher</div>
              <p className="mt-2 text-xs text-slate-400">
                Private chief of staff
              </p>
            </div>

            <nav className="mt-10 flex flex-col gap-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-400 transition-all hover:bg-blue-500/10 hover:text-white"
                >
                  <span>{item.label}</span>
                  {item.phase > 1 && (
                    <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-200">
                      soon
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            <div className="mt-auto rounded-2xl border border-blue-400/15 bg-blue-500/[0.06] p-4">
              <p className="eyebrow">System</p>
              <p className="mt-2 text-sm text-white">All systems operational</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Memory, tasks, chat history, and Tavily search are online.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-5 py-5 md:pr-8">
          <div className="mx-auto w-full max-w-[1700px] rounded-3xl border border-blue-400/10 bg-slate-950/35 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
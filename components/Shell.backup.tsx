import Link from "next/link";

const SECTIONS = [
  {
    label: "Workspace",
    items: [
      { href: "/", label: "Dashboard", status: "live" },
      { href: "/chat", label: "Chat", status: "live" },
      { href: "/settings", label: "Memory", status: "live" },
      { href: "/memory", label: "Memory Review", status: "live" },
      { href: "/projects", label: "Projects", status: "soon" },
      { href: "/files", label: "Files", status: "soon" },
    ],
  },
  {
    label: "Agents",
    items: [
      { href: "/agents/hermes", label: "Hermes", status: "soon" },
      { href: "/agents/athena", label: "Athena", status: "soon" },
      { href: "/agents/sentinel", label: "Sentinel", status: "soon" },
      { href: "/agents/mosafer", label: "Mosafer", status: "soon" },
      { href: "/finance", label: "Wealth", status: "soon" },
      { href: "/agents/atlas", label: "Atlas", status: "soon" },
    ],
  },
  {
    label: "Systems",
    items: [
      { href: "/tasks", label: "Tasks", status: "live" },
      { href: "/health", label: "Health", status: "live" },
      { href: "/settings", label: "Settings", status: "live" },
    ],
  },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="hidden w-80 shrink-0 flex-col px-5 py-5 md:flex">
          <div className="glass flex h-full flex-col rounded-3xl px-5 py-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className="wordmark text-lg text-white">Cipher</div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Private AI operating system
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
                Online · Phase 1A
              </div>
            </div>

            <nav className="mt-6 flex flex-col gap-6 overflow-y-auto pr-1">
              {SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="eyebrow mb-2 px-3">{section.label}</p>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Link
                        key={`${section.label}-${item.href}-${item.label}`}
                        href={item.href}
                        className="group flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-400 transition-all hover:bg-blue-500/10 hover:text-white"
                      >
                        <span>{item.label}</span>
                        {item.status === "soon" && (
                          <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-200">
                            soon
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto rounded-2xl border border-blue-400/15 bg-blue-500/[0.06] p-4">
              <p className="eyebrow">System</p>
              <p className="mt-2 text-sm text-white">Core services online</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Chat, history, memory extraction, tasks, Morning Sync, and search foundation are available.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-2 py-2 md:px-5 md:py-5 md:pr-8">
          <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 md:hidden">
            <div>
              <div className="wordmark text-base text-white">Cipher</div>
              <p className="text-[11px] text-slate-400">
                Private AI operating system
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link href="/" className="rounded-xl border border-white/10 px-3 py-2 text-center text-slate-200">
                Home
              </Link>
              <Link href="/chat" className="rounded-xl border border-white/10 px-3 py-2 text-center text-slate-200">
                Chat
              </Link>
              <Link href="/settings" className="rounded-xl border border-white/10 px-3 py-2 text-center text-slate-200">
                Memory
              </Link>
              <Link href="/memory" className="rounded-xl border border-white/10 px-3 py-2 text-center text-slate-200">
                Review
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[1700px] rounded-2xl border border-blue-400/10 bg-slate-950/35 p-4 shadow-2xl backdrop-blur-xl md:rounded-3xl md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
'use client'

const apps = [
  { name: 'Cipher', desc: 'Your online private chief of staff', url: '/chat', icon: '◈', badge: 'Cloud AI', accent: 'from-violet-500 to-fuchsia-500' },
  { name: 'Open WebUI', desc: 'Local chat with Ollama models', url: 'http://localhost:8080', icon: '●', badge: 'Local', accent: 'from-emerald-500 to-teal-400' },
  { name: 'Perplexica', desc: 'AI search and research engine', url: 'http://localhost:3000', icon: '⌕', badge: 'Search', accent: 'from-sky-500 to-cyan-400' },
  { name: 'Ollama', desc: 'Local model engine and model library', url: 'http://localhost:11434', icon: '◉', badge: 'Engine', accent: 'from-orange-500 to-amber-400' },
  { name: 'Hermes', desc: 'Travel and task agent workspace', url: 'http://localhost:9119', icon: '✦', badge: 'Agent', accent: 'from-purple-500 to-indigo-400' },
  { name: 'OpenClaw', desc: 'Agent gateway and tool router', url: 'http://127.0.0.1:18789', icon: '⌘', badge: 'Gateway', accent: 'from-rose-500 to-pink-400' },
  { name: 'SearXNG', desc: 'Private metasearch for live web data', url: 'http://localhost:8888', icon: '◎', badge: 'Web', accent: 'from-cyan-500 to-blue-400' },
  { name: 'Odysseus', desc: 'Local web automation assistant', url: 'http://localhost:7000', icon: '◇', badge: 'Local Web', accent: 'from-lime-500 to-green-400' },
]

const quick = [
  ['Start with Cipher', 'Use for live data, travel, cloud actions', '/chat'],
  ['Use Local AI', 'Open private local chat', 'http://localhost:8080'],
  ['AI Search', 'Open Perplexica research', 'http://localhost:3000'],
]

export default function Home() {
  function open(url: string) {
    window.open(url, url.startsWith('/') ? '_self' : '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-[#0f172a]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-[#101827] p-6 text-white lg:block">
          <div className="mb-10">
            <div className="text-3xl font-black tracking-tight">Cipher OS</div>
            <div className="mt-2 text-sm text-slate-400">Global AI launcher</div>
          </div>

          <nav className="space-y-2">
            <a className="block rounded-2xl bg-white/10 px-4 py-3 font-semibold" href="/">Overview</a>
            <a className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-white/10" href="/chat">Cipher</a>
            <button onClick={() => open('http://localhost:8080')} className="block w-full rounded-2xl px-4 py-3 text-left text-slate-300 hover:bg-white/10">Open WebUI</button>
            <button onClick={() => open('http://localhost:3000')} className="block w-full rounded-2xl px-4 py-3 text-left text-slate-300 hover:bg-white/10">Perplexica</button>
            <button onClick={() => open('http://localhost:9119')} className="block w-full rounded-2xl px-4 py-3 text-left text-slate-300 hover:bg-white/10">Hermes</button>
          </nav>

          <div className="absolute bottom-6 w-60 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-slate-400">Default Strategy</div>
            <div className="mt-1 font-bold">Local first. Cloud when needed.</div>
          </div>
        </aside>

        <section className="flex-1 p-4 md:p-8">
          <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.24em] text-violet-600">Personal AI Operating System</div>
              <h1 className="mt-2 text-4xl font-black md:text-6xl">Good evening, Faisal</h1>
              <p className="mt-2 text-slate-500">One clean entry point for Cipher, local AI, search, agents and tools.</p>
            </div>
            <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold shadow-sm">Local</button>
              <button className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500">Hybrid</button>
              <button className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500">Cloud</button>
            </div>
          </header>

          <section className="mb-6 grid gap-4 md:grid-cols-3">
            {quick.map(([title, desc, url]) => (
              <button key={title} onClick={() => open(url)} className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="text-lg font-black">{title}</div>
                <div className="mt-1 text-sm text-slate-500">{desc}</div>
              </button>
            ))}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">AI Apps</h2>
                <p className="text-sm text-slate-500">Cipher is now one app inside the global OS.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">Ready</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {apps.map(app => (
                <button key={app.name} onClick={() => open(app.url)} className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${app.accent} text-2xl font-black text-white shadow-lg`}>
                    {app.icon}
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{app.name}</h3>
                      <p className="mt-1 min-h-10 text-sm text-slate-500">{app.desc}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{app.badge}</span>
                    <span className="font-bold text-violet-600 group-hover:translate-x-1">Open →</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Ask Anything</h2>
              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <textarea className="h-28 w-full resize-none bg-transparent outline-none" placeholder="Ask Cipher OS... routing comes next." />
                <div className="mt-3 flex justify-end border-t border-slate-200 pt-3">
                  <button onClick={() => open('/chat')} className="rounded-2xl bg-[#101827] px-5 py-3 font-bold text-white">Open Cipher Chat</button>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Recommended Use</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p><b>Local AI:</b> private drafts, coding, summaries, DEWA internal notes.</p>
                <p><b>Cipher:</b> live data, travel, research, automation, final executive quality.</p>
                <p><b>Perplexica:</b> research and web search before sending to Cipher.</p>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}

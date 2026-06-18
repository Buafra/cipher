'use client'

import { useMemo, useState } from 'react'

type AppItem = {
  name: string
  label: string
  description: string
  url: string
  icon: string
  category: 'Core' | 'Local AI' | 'Search' | 'Agents'
  mode: 'Cloud' | 'Local' | 'Hybrid'
}

const apps: AppItem[] = [
  { name: 'Cipher', label: 'Chief of Staff', description: 'Online assistant for live data, automation, memory and executive work.', url: '/cipher', icon: '◆', category: 'Core', mode: 'Cloud' },
  { name: 'Open WebUI', label: 'Local Chat', description: 'Private chat with Ollama and your local models.', url: process.env.NEXT_PUBLIC_OPENWEBUI_URL || 'http://localhost:8080', icon: '◉', category: 'Local AI', mode: 'Local' },
  { name: 'Perplexica', label: 'AI Search', description: 'Research engine for web search, sources and discovery.', url: process.env.NEXT_PUBLIC_PERPLEXICA_URL || 'http://localhost:3000', icon: '⌕', category: 'Search', mode: 'Hybrid' },
  { name: 'Ollama', label: 'Model Engine', description: 'Local model server and model library.', url: process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434', icon: '⬡', category: 'Local AI', mode: 'Local' },
  { name: 'Hermes', label: 'Travel Agent', description: 'Travel, tasks, planning and agent workflows.', url: process.env.NEXT_PUBLIC_HERMES_URL || 'http://localhost:9119', icon: '✦', category: 'Agents', mode: 'Hybrid' },
  { name: 'OpenClaw', label: 'Agent Gateway', description: 'Automation gateway for connected AI tools.', url: process.env.NEXT_PUBLIC_OPENCLAW_URL || 'http://127.0.0.1:18789', icon: '✣', category: 'Agents', mode: 'Hybrid' },
  { name: 'SearXNG', label: 'Private Search', description: 'Private metasearch for local and hybrid research.', url: process.env.NEXT_PUBLIC_SEARXNG_URL || 'http://localhost:8888', icon: '◎', category: 'Search', mode: 'Local' },
  { name: 'Odysseus', label: 'Web Agent', description: 'Local web automation and agent browser.', url: process.env.NEXT_PUBLIC_ODYSSEUS_URL || 'http://localhost:7000', icon: '◇', category: 'Agents', mode: 'Local' },
]

const models = [
  { name: 'Qwen3 14B', use: 'main reasoning', status: 'Local' },
  { name: 'Gemma3 12B', use: 'general writing', status: 'Local' },
  { name: 'Qwen Coder', use: 'coding assistant', status: 'Local' },
  { name: 'DeepSeek Coder', use: 'debugging', status: 'Local' },
  { name: 'Gemini Flash', use: 'live data / low cost', status: 'Cloud' },
  { name: 'Claude Sonnet', use: 'executive quality', status: 'Cloud' },
]

const quickActions = [
  { title: 'Chat', subtitle: 'Ask Cipher OS', icon: '💬' },
  { title: 'Search', subtitle: 'Use Perplexica', icon: '🔎' },
  { title: 'Travel', subtitle: 'Open Hermes', icon: '✈️' },
  { title: 'Code', subtitle: 'Use local coder', icon: '⌘' },
  { title: 'Private Draft', subtitle: 'Use Open WebUI', icon: '🔒' },
]

export default function Home() {
  const [mode, setMode] = useState<'Auto' | 'Local' | 'Cloud'>('Auto')
  const [category, setCategory] = useState<'All' | AppItem['category']>('All')
  const [query, setQuery] = useState('')

  const visibleApps = useMemo(() => {
    if (category === 'All') return apps
    return apps.filter(app => app.category === category)
  }, [category])

  function openApp(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function smartOpen() {
    const q = query.toLowerCase()
    if (q.includes('search') || q.includes('latest') || q.includes('news') || q.includes('price')) return openApp(apps.find(a => a.name === 'Perplexica')!.url)
    if (q.includes('travel') || q.includes('flight') || q.includes('hotel')) return openApp(apps.find(a => a.name === 'Hermes')!.url)
    if (mode === 'Local') return openApp(apps.find(a => a.name === 'Open WebUI')!.url)
    return openApp('/cipher')
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f7fb] text-[#0b1020]">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_10%,rgba(124,58,237,.18),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(34,197,94,.14),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(14,165,233,.14),transparent_30%)]" />

      <div className="relative grid min-h-screen grid-cols-1 xl:grid-cols-[300px_1fr]">
        <aside className="hidden xl:flex flex-col border-r border-slate-200/80 bg-[#0b1220] px-6 py-7 text-white">
          <div>
            <div className="text-3xl font-black tracking-tight">Cipher OS</div>
            <div className="mt-1 text-sm text-slate-400">Global AI Launcher</div>
          </div>

          <nav className="mt-10 space-y-2">
            {['Overview', 'Applications', 'Models', 'Agents', 'Settings'].map((item, i) => (
              <button key={item} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${i === 0 ? 'bg-white/12 text-white' : 'text-slate-300 hover:bg-white/8'}`}>
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> {item}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-3xl border border-white/10 bg-white/8 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Default strategy</div>
            <div className="mt-2 text-lg font-bold">Local first</div>
            <p className="mt-1 text-sm text-slate-400">Cloud only when live data, search or stronger reasoning is needed.</p>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-6 md:px-8 xl:px-10">
          <header className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-violet-600 shadow-sm">Personal AI Operating System</div>
              <h1 className="mt-5 text-5xl font-black tracking-tight md:text-7xl">Good evening,<br />Faisal</h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-600">One clean home for Cipher, Open WebUI, Perplexica, Ollama, Hermes and your local AI services.</p>
            </div>

            <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70">
              {(['Auto', 'Local', 'Cloud'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${mode === m ? 'bg-[#0b1220] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                  {m}
                </button>
              ))}
            </div>
          </header>

          <section className="mx-auto mt-8 max-w-7xl rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Command bar</div>
                <div className="mt-2 flex gap-3">
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ask, search, open an app, plan travel, code..."
                    className="min-w-0 flex-1 bg-transparent text-xl font-semibold outline-none placeholder:text-slate-400"
                  />
                  <button onClick={smartOpen} className="rounded-2xl bg-[#0b1220] px-6 py-3 font-bold text-white hover:bg-black">Go</button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 lg:w-[520px]">
                {quickActions.map(action => (
                  <button key={action.title} className="rounded-2xl border border-slate-200 bg-white p-3 text-center hover:border-violet-200 hover:bg-violet-50">
                    <div className="text-2xl">{action.icon}</div>
                    <div className="mt-2 text-xs font-black">{action.title}</div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto mt-8 max-w-7xl">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-black">Applications</h2>
                <p className="text-slate-500">Cipher is now one app inside the global OS.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['All', 'Core', 'Local AI', 'Search', 'Agents'] as const).map(c => (
                  <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-4 py-2 text-sm font-bold ${category === c ? 'bg-[#0b1220] text-white' : 'bg-white text-slate-600 shadow-sm'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visibleApps.map(app => (
                <button key={app.name} onClick={() => openApp(app.url)} className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 text-left shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl">
                  <div className="flex items-start justify-between">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0b1220] text-2xl text-white shadow-lg">{app.icon}</div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${app.mode === 'Local' ? 'bg-emerald-100 text-emerald-700' : app.mode === 'Cloud' ? 'bg-violet-100 text-violet-700' : 'bg-cyan-100 text-cyan-700'}`}>{app.mode}</span>
                  </div>
                  <div className="mt-5 text-xl font-black">{app.name}</div>
                  <div className="text-sm font-bold text-violet-600">{app.label}</div>
                  <p className="mt-3 min-h-[66px] text-sm leading-6 text-slate-500">{app.description}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Open app</span>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 font-black transition group-hover:bg-[#0b1220] group-hover:text-white">→</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="mx-auto mt-8 grid max-w-7xl gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">AI Models</h2>
                  <p className="text-slate-500">Local and cloud models grouped by use.</p>
                </div>
                <button className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold">View all</button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {models.map(model => (
                  <div key={model.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-black">{model.name}</div>
                      <span className="text-xs font-bold text-emerald-600">{model.status}</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{model.use}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-[#0b1220] p-6 text-white shadow-lg">
              <h2 className="text-2xl font-black">Recommended Use</h2>
              <div className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
                <p><b className="text-emerald-300">Local AI:</b> private drafts, coding, summaries, internal notes.</p>
                <p><b className="text-violet-300">Cipher:</b> live data, travel, research, automation, final executive quality.</p>
                <p><b className="text-cyan-300">Perplexica:</b> research and web search before sending to Cipher.</p>
              </div>
              <div className="mt-6 rounded-2xl bg-white/10 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Golden rule</div>
                <div className="mt-2 font-bold">Local first. Cloud when needed. Premium only when it matters.</div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}

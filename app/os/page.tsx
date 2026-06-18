'use client'

import { useMemo, useState } from 'react'

type AppItem = {
  name: string
  subtitle: string
  description: string
  href: string
  tag: string
  type: 'Core' | 'Local AI' | 'Search' | 'Agent'
  accent: string
  icon: string
}

const apps: AppItem[] = [
  {
    name: 'Cipher',
    subtitle: 'Online Chief of Staff',
    description: 'Live data, travel, automation, executive work and cloud intelligence.',
    href: '/chat',
    tag: 'Cloud',
    type: 'Core',
    accent: 'from-violet-500 to-fuchsia-500',
    icon: '◆',
  },
  {
    name: 'Open WebUI',
    subtitle: 'Private Local Chat',
    description: 'Chat with Ollama and your local models from your home AI machine.',
    href: process.env.NEXT_PUBLIC_OPENWEBUI_URL || 'http://localhost:8080',
    tag: 'Local',
    type: 'Local AI',
    accent: 'from-emerald-400 to-teal-500',
    icon: '◉',
  },
  {
    name: 'Perplexica',
    subtitle: 'AI Search Engine',
    description: 'Research assistant for search, sources, summaries and discovery.',
    href: process.env.NEXT_PUBLIC_PERPLEXICA_URL || 'http://localhost:3000',
    tag: 'Search',
    type: 'Search',
    accent: 'from-sky-400 to-cyan-500',
    icon: '⌕',
  },
  {
    name: 'Ollama',
    subtitle: 'Local Model Engine',
    description: 'Run Qwen, Gemma, Mistral, Phi and coding models locally.',
    href: process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434',
    tag: 'Engine',
    type: 'Local AI',
    accent: 'from-orange-400 to-amber-500',
    icon: '●',
  },
  {
    name: 'Hermes',
    subtitle: 'Travel & Agent Hub',
    description: 'Agent workspace for travel planning, workflows and task execution.',
    href: process.env.NEXT_PUBLIC_HERMES_URL || 'http://localhost:9119',
    tag: 'Agent',
    type: 'Agent',
    accent: 'from-purple-400 to-indigo-500',
    icon: '✦',
  },
  {
    name: 'OpenClaw',
    subtitle: 'Agent Gateway',
    description: 'Gateway and automation control layer for local and cloud agents.',
    href: process.env.NEXT_PUBLIC_OPENCLAW_URL || 'http://127.0.0.1:18789',
    tag: 'Gateway',
    type: 'Agent',
    accent: 'from-rose-400 to-pink-500',
    icon: '⌘',
  },
  {
    name: 'SearXNG',
    subtitle: 'Private Search',
    description: 'Private metasearch for web results and research pipelines.',
    href: process.env.NEXT_PUBLIC_SEARXNG_URL || 'http://localhost:8888',
    tag: 'Web',
    type: 'Search',
    accent: 'from-cyan-400 to-blue-500',
    icon: '◎',
  },
  {
    name: 'Odysseus',
    subtitle: 'Local Web Agent',
    description: 'Browser-style agent for local automation and assisted browsing.',
    href: process.env.NEXT_PUBLIC_ODYSSEUS_URL || 'http://localhost:7000',
    tag: 'Local',
    type: 'Agent',
    accent: 'from-lime-400 to-green-500',
    icon: '◇',
  },
]

const models = [
  { name: 'Qwen3 14B', use: 'Main reasoning', status: 'Local' },
  { name: 'Gemma3 12B', use: 'General writing', status: 'Local' },
  { name: 'DeepSeek Coder', use: 'Code & debugging', status: 'Local' },
  { name: 'Mistral', use: 'Fast chat', status: 'Local' },
  { name: 'Gemini Flash', use: 'Live / low cost', status: 'Cloud' },
  { name: 'Claude Sonnet', use: 'Executive quality', status: 'Cloud' },
]

export default function CipherOSHome() {
  const [filter, setFilter] = useState<'All' | AppItem['type']>('All')
  const [mode, setMode] = useState<'Local' | 'Hybrid' | 'Cloud'>('Hybrid')

  const filteredApps = useMemo(() => {
    if (filter === 'All') return apps
    return apps.filter(app => app.type === filter)
  }, [filter])

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#080b12] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(124,58,237,.30),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(16,185,129,.22),transparent_28%),linear-gradient(180deg,#080b12_0%,#0b1020_100%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#080b12]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5 lg:px-10">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-black text-[#080b12]">C</div>
            <div>
              <div className="text-2xl font-black tracking-tight">Cipher OS</div>
              <div className="text-sm text-slate-400">Global AI launcher</div>
            </div>
          </div>

          <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-1 md:flex">
            {(['Local', 'Hybrid', 'Cloud'] as const).map(item => (
              <button
                key={item}
                onClick={() => setMode(item)}
                className={`rounded-xl px-5 py-2 text-sm font-bold transition ${mode === item ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10'}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="hidden text-sm text-slate-300 sm:block">Ready</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 font-bold">F</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl lg:p-10">
            <div className="mb-5 inline-flex rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.32em] text-violet-200">
              Personal AI Operating System
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
              Good evening,<br /> Faisal.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              One global home for Cipher, Open WebUI, Perplexica, Ollama, Hermes, agents and local AI services.
            </p>

            <div className="mt-8 rounded-3xl border border-white/10 bg-[#070a12] p-4 shadow-inner">
              <div className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-slate-500">Command Bar</div>
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  className="min-h-14 flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 text-base text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
                  placeholder="Ask, search, open an app, plan travel, write code..."
                />
                <button className="rounded-2xl bg-white px-7 py-4 font-black text-slate-950 transition hover:bg-slate-200">Go</button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <a href="/chat" className="group rounded-[2rem] border border-white/10 bg-white p-7 text-slate-950 shadow-2xl transition hover:-translate-y-1">
              <div className="text-sm font-black uppercase tracking-[0.25em] text-violet-600">Start Here</div>
              <h2 className="mt-4 text-4xl font-black">Open Cipher</h2>
              <p className="mt-3 text-slate-600">Use live data, travel planning, memory, automation and executive cloud reasoning.</p>
              <div className="mt-8 font-black text-violet-600">Launch Cipher →</div>
            </a>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 backdrop-blur-xl">
              <div className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">Best Daily Rule</div>
              <div className="mt-4 space-y-4 text-slate-300">
                <p><b className="text-white">Local:</b> private drafts, coding, summaries.</p>
                <p><b className="text-white">Cipher:</b> live data, travel, final outputs.</p>
                <p><b className="text-white">Hybrid:</b> best default.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl lg:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-black">Applications</h2>
              <p className="mt-2 text-slate-400">Cipher is one app inside the global OS. Open any service directly.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['All', 'Core', 'Local AI', 'Search', 'Agent'] as const).map(item => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${filter === item ? 'bg-white text-slate-950' : 'bg-white/10 text-slate-300 hover:bg-white/15'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredApps.map(app => (
              <a
                key={app.name}
                href={app.href}
                target={app.href.startsWith('http') ? '_blank' : undefined}
                rel={app.href.startsWith('http') ? 'noreferrer' : undefined}
                className="group min-h-[240px] rounded-3xl border border-white/10 bg-[#0d1322] p-5 transition hover:-translate-y-1 hover:border-white/25 hover:bg-[#121a2d]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${app.accent} text-2xl font-black text-white shadow-lg`}>
                    {app.icon}
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">{app.tag}</span>
                </div>
                <h3 className="mt-5 text-2xl font-black">{app.name}</h3>
                <div className="mt-1 text-sm font-bold text-cyan-200">{app.subtitle}</div>
                <p className="mt-4 min-h-[72px] text-sm leading-6 text-slate-400">{app.description}</p>
                <div className="mt-5 font-black text-white/90 group-hover:text-cyan-200">Open App →</div>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl lg:p-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black">Models</h2>
                <p className="mt-2 text-slate-400">Local and cloud models available in your ecosystem.</p>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">6 ready</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {models.map(model => (
                <div key={model.name} className="rounded-2xl border border-white/10 bg-[#0d1322] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-black">{model.name}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${model.status === 'Local' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-violet-400/10 text-violet-300'}`}>{model.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{model.use}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl lg:p-8">
            <h2 className="text-3xl font-black">System Strategy</h2>
            <div className="mt-6 space-y-4">
              {[
                ['Private / sensitive', 'Use Local AI only'],
                ['Needs latest info', 'Use Cipher / Cloud'],
                ['Daily work', 'Use Hybrid mode'],
                ['Executive output', 'Use Claude / Cipher'],
              ].map(([a, b]) => (
                <div key={a} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0d1322] p-4">
                  <span className="text-slate-300">{a}</span>
                  <span className="font-black text-white">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

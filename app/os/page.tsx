'use client'

import { useEffect, useMemo, useState } from 'react'

type Service = {
  key: string
  name: string
  url: string
  type: 'local' | 'cloud' | 'search' | 'agent'
  desc: string
  icon: string
  online?: boolean
  latencyMs?: number | null
}

const fallbackServices: Service[] = [
  { key: 'cipher', name: 'Cipher', url: '/', type: 'cloud', desc: 'Main online AI command center', icon: '◆' },
  { key: 'openwebui', name: 'Open WebUI', url: 'http://localhost:8080', type: 'local', desc: 'Local private chat interface', icon: '💬' },
  { key: 'perplexica', name: 'Perplexica', url: 'http://localhost:3000', type: 'search', desc: 'AI search and research', icon: '🔎' },
  { key: 'ollama', name: 'Ollama', url: 'http://localhost:11434', type: 'local', desc: 'Local model engine', icon: '🧠' },
  { key: 'searxng', name: 'SearXNG', url: 'http://localhost:8888', type: 'search', desc: 'Private metasearch', icon: '🌐' },
  { key: 'openclaw', name: 'OpenClaw', url: 'http://127.0.0.1:18789', type: 'agent', desc: 'Agent gateway', icon: '🦾' },
  { key: 'hermes', name: 'Hermes', url: 'http://localhost:9119', type: 'agent', desc: 'Hermes agent dashboard', icon: '⚡' },
  { key: 'odysseus', name: 'Odysseus', url: 'http://localhost:7000', type: 'agent', desc: 'Local web agent', icon: '🧭' },
]

const models = [
  ['qwen-main', 'Qwen3 14B', 'Main reasoning'],
  ['gemma-general', 'Gemma3 12B', 'General writing'],
  ['qwen-coder', 'Qwen Coder', 'Coding'],
  ['deepseek-code', 'DeepSeek Coder', 'Debugging'],
  ['mistral-chat', 'Mistral', 'Fast chat'],
  ['phi-fast', 'Phi Fast', 'Quick answers'],
]

export default function CipherOSPage() {
  const [services, setServices] = useState<Service[]>(fallbackServices)
  const [selectedKey, setSelectedKey] = useState('openwebui')
  const [mode, setMode] = useState<'local' | 'hybrid' | 'cloud'>('hybrid')
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/api/status', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data?.services?.length) {
          const merged = fallbackServices.map(s => ({ ...s, ...(data.services.find((x: any) => x.key === s.key) || {}) }))
          setServices(merged)
        }
      })
      .catch(() => {})
  }, [])

  const selected = useMemo(() => services.find(s => s.key === selectedKey) || services[0], [services, selectedKey])
  const localOnline = services.filter(s => s.online && s.type === 'local').length

  function openSelected() {
    if (!selected?.url) return
    window.open(selected.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-white/10 bg-[#0f172a] p-5 lg:block">
          <div className="mb-8">
            <div className="text-3xl font-black tracking-[0.35em] text-white">CIPHER</div>
            <div className="mt-2 text-sm text-slate-400">AI Command Center</div>
          </div>

          <nav className="space-y-2">
            {services.map(s => (
              <button
                key={s.key}
                onClick={() => setSelectedKey(s.key)}
                className={`w-full rounded-xl px-4 py-3 text-left transition ${selectedKey === s.key ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <span className="mr-3">{s.icon}</span>{s.name}
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex-1">
          <header className="border-b border-white/10 bg-[#0b0f19]/95 px-5 py-4 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold">Cipher OS</h1>
                <p className="text-sm text-slate-400">Open WebUI-style launcher for all AI interfaces</p>
              </div>

              <div className="flex gap-2">
                {(['local', 'hybrid', 'cloud'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} className={`rounded-xl px-4 py-2 text-sm capitalize ${mode === m ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{m}</button>
                ))}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-6xl p-5">
            <section className="rounded-3xl border border-white/10 bg-[#111827] p-5 shadow-2xl">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm uppercase tracking-[0.25em] text-slate-500">Choose Interface</div>
                  <h2 className="mt-1 text-3xl font-bold">Where do you want to work?</h2>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                  Local services online: {localOnline}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <select
                  value={selectedKey}
                  onChange={e => setSelectedKey(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#0b1220] px-5 py-4 text-lg text-white outline-none focus:border-cyan-400"
                >
                  {services.map(s => (
                    <option key={s.key} value={s.key}>{s.name} — {s.desc}</option>
                  ))}
                </select>
                <button onClick={openSelected} className="rounded-2xl bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-200">
                  Open {selected.name} →
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-[#0b1220] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-4xl">{selected.icon}</div>
                    <h3 className="mt-3 text-2xl font-bold">{selected.name}</h3>
                    <p className="mt-1 text-slate-400">{selected.desc}</p>
                    <p className="mt-3 break-all text-sm text-cyan-300">{selected.url}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${selected.online ? 'bg-emerald-400/15 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                    {selected.online ? 'ONLINE' : 'LINK'}
                  </span>
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-3xl border border-white/10 bg-[#111827] p-5">
              <div className="mb-4 text-sm uppercase tracking-[0.25em] text-slate-500">Ask Cipher OS</div>
              <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                <textarea
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Ask anything... then choose Local, Hybrid, or Cloud mode. Router will be connected later."
                  className="h-32 w-full resize-none bg-transparent text-lg outline-none placeholder:text-slate-500"
                />
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-sm text-slate-400">Current mode: <b className="text-white">{mode}</b></span>
                  <button className="rounded-xl bg-cyan-400 px-5 py-2 font-bold text-slate-950 hover:bg-cyan-300">Send</button>
                </div>
              </div>
            </section>

            <section className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {services.map(s => (
                <button key={s.key} onClick={() => setSelectedKey(s.key)} className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-left hover:bg-[#172033]">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{s.icon}</span>
                    <span className={`text-xs ${s.online ? 'text-emerald-300' : 'text-slate-500'}`}>{s.online ? 'online' : s.type}</span>
                  </div>
                  <div className="mt-3 font-bold">{s.name}</div>
                  <div className="mt-1 text-sm text-slate-400">{s.desc}</div>
                </button>
              ))}
            </section>

            <section className="mt-5 rounded-3xl border border-white/10 bg-[#111827] p-5">
              <h2 className="text-xl font-bold">Local AI Models</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {models.map(([id, name, desc]) => (
                  <div key={id} className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                    <div className="font-bold">{name}</div>
                    <div className="text-sm text-slate-400">{desc}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

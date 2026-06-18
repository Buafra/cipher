import { NextResponse } from 'next/server'

const services = [
  { key: 'cipher', name: 'Cipher', url: process.env.NEXT_PUBLIC_CIPHER_URL || '/' },
  { key: 'openwebui', name: 'Open WebUI', url: process.env.NEXT_PUBLIC_OPENWEBUI_URL || 'http://localhost:8080' },
  { key: 'perplexica', name: 'Perplexica', url: process.env.NEXT_PUBLIC_PERPLEXICA_URL || 'http://localhost:3000' },
  { key: 'ollama', name: 'Ollama', url: process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434' },
  { key: 'searxng', name: 'SearXNG', url: process.env.NEXT_PUBLIC_SEARXNG_URL || 'http://localhost:8888' },
  { key: 'openclaw', name: 'OpenClaw', url: process.env.NEXT_PUBLIC_OPENCLAW_URL || 'http://127.0.0.1:18789' },
  { key: 'hermes', name: 'Hermes', url: process.env.NEXT_PUBLIC_HERMES_URL || 'http://localhost:9119' },
  { key: 'odysseus', name: 'Odysseus', url: process.env.NEXT_PUBLIC_ODYSSEUS_URL || 'http://localhost:7000' },
]

async function check(service: any) {
  if (service.url === '/') return { ...service, online: true, latencyMs: 0 }
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1500)
    const res = await fetch(service.url, { signal: controller.signal, cache: 'no-store', mode: 'no-cors' as RequestMode })
    clearTimeout(timeout)
    return { ...service, online: res.ok || res.type === 'opaque', latencyMs: Date.now() - start }
  } catch {
    return { ...service, online: false, latencyMs: null }
  }
}

export async function GET() {
  const results = await Promise.all(services.map(check))
  return NextResponse.json({ services: results, checkedAt: new Date().toISOString() })
}

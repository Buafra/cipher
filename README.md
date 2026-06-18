# Cipher

A personal AI operating system — a private chief of staff that watches your
data, notices what matters, and surfaces it before you ask. This is the
scaffold: a runnable Next.js app with all four architecture layers in place
and Phase 1 (chat + memory) working end to end.

---

## How the code maps to the architecture

| Doc layer | In this repo |
|---|---|
| **1. Interface** | `app/*/page.tsx` + `components/*` (Next.js, Tailwind) |
| **The relay (§5)** | `app/api/*/route.ts` — server-side, holds all secrets |
| **2. Data & Memory** | `supabase/schema.sql` + `lib/supabase.ts` + `lib/memory.ts` |
| **3. Intelligence** | `lib/claude.ts` + `lib/prompt.ts` |
| **4. Automation (§6)** | `app/api/cron/*` + `vercel.json` |

The browser only ever talks to your own API routes. The routes hold the
Claude and Supabase keys and talk to the outside world. That's the relay
pattern from §5 — secrets stay off the client, and there's one place to
change models or add rules.

---

## Setup (about 20 minutes)

You need Node 18+ installed. Then:

### 1. Install dependencies
```bash
npm install
```

### 2. Create a Supabase project
- Go to https://supabase.com → New project (the free tier is fine).
- Open **SQL Editor → New query**, paste the entire contents of
  `supabase/schema.sql`, and run it. This creates every table.
- **Get your Project URL.** Click the **Connect** button at the top of your
  project dashboard — the dialog shows the Project URL (it looks like
  `https://<your-ref>.supabase.co`). It's also under **Settings → Data API**.
  Put this in `NEXT_PUBLIC_SUPABASE_URL`.
- **Get a secret server key.** Supabase recently revamped its keys, so go to
  **Settings → API Keys** (not the old "API" page):
  - *Preferred:* on the **API Keys** tab, create/copy a **Secret key**
    (starts with `sb_secret_…`). It bypasses RLS and is rejected outright if
    ever used in a browser — exactly what a server-only app wants.
  - *Or:* on the **Legacy API Keys** tab, copy the **service_role** key.
    (Legacy keys still work but Supabase plans to deprecate them by the end
    of 2026.)
  - Paste whichever one you use into `SUPABASE_SERVICE_ROLE_KEY` in
    `.env.local` — the variable name is just a label; the client accepts
    either. **Don't** use the publishable/anon key here; Cipher is
    server-only and never needs it.

> **⚠️ Security note — Row Level Security (RLS).** The schema creates these
> tables **without** RLS enabled. That is safe *only* because Cipher talks to
> the database exclusively from the server using a secret/service_role key
> (which bypasses RLS), and never exposes a publishable/anon key to the
> browser. **Do not put a publishable or anon key in client code** — with RLS
> off, anyone holding it could read or
> write your tables directly. The moment you add Supabase Auth or any
> client-side database access, **enable RLS and add per-user policies first**.
> Decide which path you want before you build on this.

### 3. Get a Claude API key
- https://console.anthropic.com → **API Keys** → create one.

### 4. Configure environment
```bash
cp .env.example .env.local
```
Open `.env.local` and fill in every value. For `CIPHER_USER_ID`, either keep
the default that's already seeded in the schema, or generate your own with:
```bash
node -e "console.log(crypto.randomUUID())"
```
(If you change it, update the seed row at the bottom of `schema.sql` too.)

### 5. Run it
```bash
npm run dev
```
Open http://localhost:3000.

---

## Try Phase 1 right now

1. Go to **Memory** and add a couple of facts ("Prefers aisle seats",
   "Daughter: Mara, age 7").
2. Go to **Chat** and ask something that relies on them
   ("What seat should I book?"). Cipher should answer using your facts —
   that's memory injection working.
3. Tell it something new mid-chat ("Remember I hate early meetings"), then
   add it on the Memory screen. (Cipher now auto-extracts durable facts from chat — watch for the "Remembered" line. This was a
   Phase 1.5 upgrade — see the roadmap.)

### Test the automation layer locally
The cron jobs are just protected GET endpoints. Trigger them by hand:
```bash
# daily briefing
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/briefing

# hourly triggers
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/triggers
```
Reload the home page after the briefing call — your morning dispatch appears.

---

## Deploying (so it runs while the app is closed)

The proactive layer only matters if it runs on a schedule without you. Easiest path:

1. Push this repo to GitHub.
2. Import it into **Vercel**. Add all the `.env.local` variables in the
   Vercel project settings.
3. `vercel.json` already declares the cron schedule (briefing at 06:00 daily,
   triggers hourly). Vercel runs them automatically and sends the
   `Authorization: Bearer <CRON_SECRET>` header — set `CRON_SECRET` in Vercel
   to the same value you used locally.

---

## Build roadmap (your chosen order)

**Phase 1 — Chat + memory** ✅ *built*
The foundation. Everything else reuses `buildSystemPrompt` and the memory table.

**Phase 1.5 — Auto-memory** ✅ *built*
After each chat reply, a second Claude call (`lib/extract.ts` →
`/api/memory/extract`) pulls out durable facts and stores them as
`inferred`. It runs in its own request so the chat never slows down, dedupes
against what's already known, and the chat UI shows a quiet "Remembered…"
line so you can see what it learned. Cipher now learns on its own.

**Phase 2 — Daily brief + tasks + reminders** *(mostly built)*
- Tasks API and table exist; build a small task screen (mirror `MemoryEditor`).
- The briefing job already gathers tasks + alerts and writes a dispatch.
- The trigger job already nudges on due-soon tasks.
- Add a dedicated `/api/profile` route so the briefing textarea saves cleanly
  (right now it routes through the memory endpoint — see the note in
  `MemoryEditor.tsx`).

**Phase 3 — Finance**
Add a price source + `fetchPrice()`, uncomment the finance block in the
trigger job, and build the `finance_watches` editor. See `app/finance/page.tsx`.

**Phase 4 — Health**
Choose an input (manual or wearable export), write to `health_logs`, add a
baseline anomaly check to the trigger job, and surface trends. See
`app/health/page.tsx`.

---

## A few honest notes

- **I couldn't `npm install` or run a build in the environment that generated
  this**, so treat the first `npm run dev` as your real compile check. The code
  is written to be correct, but if a dependency version drifts, the error
  messages will point you to it.
- **Single user, no login.** Cipher is built for one person, so it uses a fixed
  `CIPHER_USER_ID` and the server-side service key instead of auth. When you
  want real multi-device login, add Supabase Auth, enable Row Level Security,
  and add per-user policies. The schema already carries `user_id` everywhere
  so this is additive, not a rewrite.
- **Model string.** `CIPHER_MODEL` defaults to a Claude Sonnet string. Check
  https://docs.claude.com for the current model names and update the env var
  if needed.
- **Keep secrets server-side.** Never import `lib/supabase.ts` or `lib/claude.ts`
  from a `"use client"` component. Client code talks to `/api/*` only.

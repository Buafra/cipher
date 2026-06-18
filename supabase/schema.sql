-- ════════════════════════════════════════════════════════════════
--  CIPHER — database schema  (Layer 2: Data & Memory)
--  Run this whole file once in Supabase → SQL Editor → New query.
--  It is safe to re-run: every object uses "if not exists".
--
--  Cipher is single-user. We don't store many people — we store one
--  person richly. Every row carries a user_id so you *could* add more
--  later, but for now they all share your fixed CIPHER_USER_ID.
--
--  ⚠️  SECURITY: this script does NOT enable Row Level Security. That is
--  safe only because Cipher reaches the database from the server with the
--  service_role key and never exposes the anon key to the browser. If you
--  add Supabase Auth or any client-side access, enable RLS and add per-user
--  policies BEFORE doing so. See the note at the end of this file.
-- ════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Profile: the one-time "briefing about my life" (doc §7) ──────────
create table if not exists profiles (
  user_id     uuid primary key,
  briefing    text default '',        -- foundational memory, referenced everywhere
  updated_at  timestamptz default now()
);

-- ── Memory: a flat table of discrete facts (doc §7) ─────────────────
--  The mechanism that makes responses feel personal. Short entries the
--  user adds or the system infers: preferences, people, commitments.
create table if not exists memory (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  category    text default 'general',  -- e.g. preference | person | commitment | project
  fact        text not null,           -- "Prefers morning flights"  /  "Wife: Lena, birthday Apr 3"
  source      text default 'user',     -- 'user' (added) | 'inferred' (learned)
  created_at  timestamptz default now()
);
create index if not exists memory_user_idx on memory (user_id);

-- ── Conversations + messages (Layer 1 ↔ 3 history) ──────────────────
create table if not exists conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  title       text default 'New conversation',
  created_at  timestamptz default now()
);

create table if not exists messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  role             text not null,      -- 'user' | 'assistant'
  content          text not null,
  created_at       timestamptz default now()
);
create index if not exists messages_conv_idx on messages (conversation_id, created_at);

-- ── Tasks & reminders  (Phase 2) ────────────────────────────────────
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  title       text not null,
  notes       text default '',
  due_at      timestamptz,
  status      text default 'open',     -- 'open' | 'done'
  created_at  timestamptz default now()
);
create index if not exists tasks_user_idx on tasks (user_id, status);

-- ── Briefings: the daily morning dispatch  (doc §6, Phase 2) ────────
create table if not exists briefings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  for_date    date not null,
  content     text not null,
  created_at  timestamptz default now()
);
create unique index if not exists briefings_user_date on briefings (user_id, for_date);

-- ── Alerts: short-lived trigger outputs  (doc §6, Phase 2/3) ────────
create table if not exists alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  kind        text not null,           -- 'finance' | 'task' | 'health' | 'system'
  title       text not null,
  body        text default '',
  severity    text default 'info',     -- 'info' | 'warn' | 'urgent'
  read        boolean default false,
  expires_at  timestamptz,             -- triggers are short-lived by design
  created_at  timestamptz default now()
);
create index if not exists alerts_user_idx on alerts (user_id, read, created_at);

-- ── Finance watches  (Phase 3) ──────────────────────────────────────
create table if not exists finance_watches (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null,
  symbol          text not null,       -- 'AAPL' | 'BTC-USD' | ...
  threshold_type  text not null,       -- 'above' | 'below' | 'pct_move'
  threshold_value numeric not null,
  last_value      numeric,             -- updated by the hourly trigger job
  created_at      timestamptz default now()
);
create index if not exists finance_user_idx on finance_watches (user_id);

-- ── Health logs  (Phase 4) ──────────────────────────────────────────
create table if not exists health_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  metric      text not null,           -- 'weight' | 'sleep_hours' | 'resting_hr' | ...
  value       numeric not null,
  unit        text default '',
  logged_at   timestamptz default now()
);
create index if not exists health_user_idx on health_logs (user_id, metric, logged_at);

-- ── Seed your single profile row ────────────────────────────────────
--  Replace the UUID below with your CIPHER_USER_ID if you changed it.
insert into profiles (user_id, briefing)
values ('00000000-0000-0000-0000-000000000001', '')
on conflict (user_id) do nothing;

-- ────────────────────────────────────────────────────────────────────
--  NOTE on security: this scaffold talks to the database only from the
--  server (via the service-role key in your API routes), so Row Level
--  Security is not required to start. When you add Supabase Auth for
--  real multi-device login, enable RLS and add per-user policies then.
-- ────────────────────────────────────────────────────────────────────

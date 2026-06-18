import { createClient } from "@supabase/supabase-js";

/**
 * Layer 2 — Data & Memory.
 *
 * One server-side Supabase client, created with the SERVICE ROLE key.
 * This file must only ever be imported from server code (API routes,
 * server components, cron jobs) — never from a "use client" component,
 * or the key would leak to the browser.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
}

export const db = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

/** The single user this Cipher instance belongs to. */
export const USER_ID =
  process.env.CIPHER_USER_ID ?? "00000000-0000-0000-0000-000000000001";

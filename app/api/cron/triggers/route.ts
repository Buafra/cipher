import { NextRequest, NextResponse } from "next/server";
import { db, USER_ID } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * GET /api/cron/triggers   (Layer 4: Automation — the frequent 'trigger' job)
 *
 * Runs every hour. Checks a small set of conditions and creates a SHORT-LIVED
 * alert only when one is actually met (doc §6). Cheap and quiet by design —
 * it should usually do nothing.
 *
 * Phase 2 (live now):  due-soon tasks.
 * Phase 3 (stub below): finance thresholds — needs a price source.
 * Phase 4 (stub below): health anomalies.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const created: string[] = [];

  try {
    // ── Phase 2: tasks due within the next 24h get one nudge alert ──────
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: dueTasks } = await db
      .from("tasks")
      .select("id, title, due_at")
      .eq("user_id", USER_ID)
      .eq("status", "open")
      .not("due_at", "is", null)
      .lte("due_at", soon);

    for (const t of dueTasks ?? []) {
      const alreadyAlerted = await hasRecentAlert("task", t.title);
      if (!alreadyAlerted) {
        await createAlert({
          kind: "task",
          title: "Task due soon",
          body: `${t.title} is due ${t.due_at}.`,
          severity: "warn",
          ttlHours: 24,
        });
        created.push(`task:${t.title}`);
      }
    }

    // ── Phase 3 (STUB): finance thresholds ──────────────────────────────
    // const { data: watches } = await db.from("finance_watches")
    //   .select("*").eq("user_id", USER_ID);
    // for (const w of watches ?? []) {
    //   const price = await fetchPrice(w.symbol);        // <- add a price source
    //   if (crossed(w, price)) {
    //     await createAlert({ kind: "finance", title: `${w.symbol} ${w.threshold_type} ${w.threshold_value}`,
    //       body: `Now ${price}.`, severity: "urgent", ttlHours: 6 });
    //   }
    //   await db.from("finance_watches").update({ last_value: price }).eq("id", w.id);
    // }

    // ── Phase 4 (STUB): health anomalies ────────────────────────────────
    // Compare recent health_logs against rolling baselines and alert on
    // meaningful deviations.

    return NextResponse.json({ ok: true, created });
  } catch (err: any) {
    console.error("[cron/triggers]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function hasRecentAlert(kind: string, titleContains: string): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await db
    .from("alerts")
    .select("id, body")
    .eq("user_id", USER_ID)
    .eq("kind", kind)
    .gte("created_at", since);
  return (data ?? []).some((a) => a.body.includes(titleContains));
}

async function createAlert(a: {
  kind: "finance" | "task" | "health" | "system";
  title: string;
  body: string;
  severity: "info" | "warn" | "urgent";
  ttlHours: number;
}) {
  await db.from("alerts").insert({
    user_id: USER_ID,
    kind: a.kind,
    title: a.title,
    body: a.body,
    severity: a.severity,
    expires_at: new Date(Date.now() + a.ttlHours * 3600 * 1000).toISOString(),
  });
}

function isAuthorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  return !!secret && header === `Bearer ${secret}`;
}

import { NextRequest, NextResponse } from "next/server";
import { db, USER_ID } from "@/lib/supabase";
import { loadMemory, loadProfile } from "@/lib/memory";
import { buildSystemPrompt } from "@/lib/prompt";
import { reason } from "@/lib/claude";

export const runtime = "nodejs";

/**
 * GET /api/cron/briefing   (Layer 4: Automation — the daily 'briefing' job)
 *
 * Runs once each morning (scheduled in vercel.json). Pulls together what
 * matters across the areas Cipher tracks and writes ONE readable summary
 * the user sees the moment they open the app. Runs whether or not the app
 * is open — that's what makes Cipher feel proactive (doc §6).
 *
 * Protected by CRON_SECRET so only your scheduler can trigger it.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    // Gather the day's raw material.
    const [profile, facts] = await Promise.all([loadProfile(), loadMemory()]);

    const { data: tasks } = await db
      .from("tasks")
      .select("title, due_at, status")
      .eq("user_id", USER_ID)
      .eq("status", "open")
      .order("due_at", { ascending: true, nullsFirst: false });

    const { data: alerts } = await db
      .from("alerts")
      .select("title, body, severity")
      .eq("user_id", USER_ID)
      .eq("read", false)
      .order("created_at", { ascending: false });

    // PHASE 3/4: also gather finance_watches movements and recent health_logs
    // here, and pass them into the context string below.

    const context = [
      tasks?.length
        ? `Open tasks:\n${tasks.map((t) => `- ${t.title}${t.due_at ? ` (due ${t.due_at})` : ""}`).join("\n")}`
        : "No open tasks.",
      alerts?.length
        ? `Unread alerts:\n${alerts.map((a) => `- [${a.severity}] ${a.title}: ${a.body}`).join("\n")}`
        : "No unread alerts.",
    ].join("\n\n");

    const system = buildSystemPrompt(profile, facts, context);
    const content = await reason(
      system,
      [
        {
          role: "user",
          content:
            "Write my morning briefing for today. A short, calm dispatch: what needs my attention, anything time-sensitive, and one suggestion if warranted. No greeting fluff.",
        },
      ],
      700
    );

    // Upsert so re-running the same day overwrites rather than duplicates.
    await db
      .from("briefings")
      .upsert(
        { user_id: USER_ID, for_date: today, content },
        { onConflict: "user_id,for_date" }
      );

    return NextResponse.json({ ok: true, for_date: today });
  } catch (err: any) {
    console.error("[cron/briefing]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function isAuthorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Vercel Cron sends:  Authorization: Bearer <CRON_SECRET>
  const header = req.headers.get("authorization");
  return !!secret && header === `Bearer ${secret}`;
}

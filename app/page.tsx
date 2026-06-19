import { db, USER_ID } from "@/lib/supabase";
import { Card, Eyebrow } from "@/components/Card";
import Link from "next/link";

export const dynamic = "force-dynamic"; // always read fresh on load

async function getDashboard() {
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: briefing }, { data: tasks }, { data: alerts }] = await Promise.all([
    db.from("briefings").select("content, for_date").eq("user_id", USER_ID).eq("for_date", today).maybeSingle(),
    db.from("tasks").select("id, title, due_at").eq("user_id", USER_ID).eq("status", "open").order("due_at", { ascending: true, nullsFirst: false }).limit(5),
    db.from("alerts").select("id, title, body, severity").eq("user_id", USER_ID).eq("read", false).order("created_at", { ascending: false }).limit(5),
  ]);

  return { briefing, tasks: tasks ?? [], alerts: alerts ?? [] };
}

export default async function Home() {
  const { briefing, tasks, alerts } = await getDashboard();
  const now = new Date();
  const greeting = now.getHours() < 12 ? "This morning" : now.getHours() < 18 ? "This afternoon" : "This evening";

  return (
    <div className="space-y-10">
      {/* Hero: the morning dispatch */}
      <section>
        <Eyebrow>{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</Eyebrow>
        <h1 className="font-display text-3xl font-light text-paper">{greeting}</h1>

        <div className="mt-6">
          {briefing?.content ? (
            <p className="whitespace-pre-line font-display text-lg font-light leading-relaxed text-paper">
              {briefing.content}
            </p>
          ) : (
            <Card>
              <p className="text-paper-dim">
                No briefing yet today. It's written each morning by the automation layer.
                Trigger one now from the terminal, or just{" "}
                <Link href="/chat" className="text-brass underline-offset-4 hover:underline">
                  start a conversation
                </Link>
                .
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* Alerts — only present when something actually fired */}
      {alerts.length > 0 && (
        <section>
          <Eyebrow>Needs attention</Eyebrow>
          <div className="space-y-3">
            {alerts.map((a) => (
              <Card key={a.id} className="border-l-2 border-l-brass">
                <div className="flex items-baseline justify-between">
                  <span className="text-paper">{a.title}</span>
                  <span className="text-[10px] uppercase tracking-eyebrow text-paper-faint">{a.severity}</span>
                </div>
                {a.body && <p className="mt-1 text-sm text-paper-dim">{a.body}</p>}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Tasks */}
      <section>
        <Eyebrow>On your plate</Eyebrow>
        {tasks.length === 0 ? (
          <p className="text-sm text-paper-dim">Nothing open. A rare and pleasant state.</p>
        ) : (
          <ul className="divide-y divide-ink-hair">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <span className="text-paper">{t.title}</span>
                {t.due_at && (
<span className="text-xs text-paper-faint">
  {t.due_at
    ? new Date(t.due_at).toLocaleString("en-AE", {
        timeZone: "Asia/Dubai",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "No due date"}
</span>{new Date(t.due_at).toLocaleString("en-AE", {
  timeZone: "Asia/Dubai",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})}                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

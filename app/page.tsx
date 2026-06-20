import { db, USER_ID } from "@/lib/supabase";
import { Card, Eyebrow } from "@/components/Card";
import Link from "next/link";
import RefreshBriefingButton from "@/components/RefreshBriefingButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function getDashboard() {
  const [{ data: briefing }, { data: tasks }, { data: alerts }] =
    await Promise.all([
      db.from("morning_briefings")
        .select("payload, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      db.from("tasks")
        .select("id, title, due_at")
        .eq("user_id", USER_ID)
        .eq("status", "open")
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(10),

      db.from("alerts")
        .select("id, title, body, severity")
        .eq("user_id", USER_ID)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return { briefing, tasks: tasks ?? [], alerts: alerts ?? [] };
}

function formatTaskDate(dueAt: string | null) {
  if (!dueAt) return "No due date";

  return new Date(dueAt).toLocaleString("en-AE", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFx(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "N/A";
  return (1 / n).toFixed(4);
}

export default async function Home() {
  const { briefing, tasks, alerts } = await getDashboard();
  const payload = briefing?.payload as any;

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "This morning"
      : now.getHours() < 18
        ? "This afternoon"
        : "This evening";

  return (
    <div className="space-y-10">
      <section>
        <Eyebrow>
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Eyebrow>

        <h1 className="font-display text-3xl font-light text-paper">
          {greeting}
        </h1>

        <div className="mt-6">
          {payload ? (
            <Card>
              <div className="space-y-5">
                <div>
                  <Eyebrow>Latest Morning Sync</Eyebrow>
                  <p className="mt-2 text-sm text-paper-faint">
                    {payload.date}
                  </p>
                </div>

                <p className="whitespace-pre-line font-display text-lg font-light leading-relaxed text-paper">
                  {payload.executiveInsight}
                </p>

                <div className="grid gap-3 text-sm text-paper-dim md:grid-cols-2">
                  <div>🌤️ Weather: {payload.weather}</div>
                  <div>
                    🥇 Gold: {payload.metals?.gold} | Silver:{" "}
                    {payload.metals?.silver}
                  </div>
                  <div>
                    ₿ BTC: {payload.crypto?.btc} | ETH: {payload.crypto?.eth}
                  </div>
                  <div>
                    💱 1 USD = {formatFx(payload.fx?.usd)} AED
                  </div>
                </div>

                {payload.news?.length > 0 && (
                  <div className="space-y-2">
                    <Eyebrow>AI + Tech Signals</Eyebrow>
                    <ul className="space-y-2 text-sm text-paper-dim">
                      {payload.news.slice(0, 3).map((item: string, i: number) => (
                        <li key={i} className="whitespace-pre-line">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                 <RefreshBriefingButton />
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-paper-dim">
                No briefing yet today. Trigger one now from the terminal, or just{" "}
                <Link
                  href="/chat"
                  className="text-brass underline-offset-4 hover:underline"
                >
                  start a conversation
                </Link>
                .
              </p>
            </Card>
          )}
        </div>
      </section>

      {alerts.length > 0 && (
        <section>
          <Eyebrow>Needs attention</Eyebrow>
          <div className="space-y-3">
            {alerts.map((a) => (
              <Card key={a.id} className="border-l-2 border-l-brass">
                <div className="flex items-baseline justify-between">
                  <span className="text-paper">{a.title}</span>
                  <span className="text-[10px] uppercase tracking-eyebrow text-paper-faint">
                    {a.severity}
                  </span>
                </div>
                {a.body && (
                  <p className="mt-1 text-sm text-paper-dim">{a.body}</p>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <Eyebrow>On your plate</Eyebrow>

        {tasks.length === 0 ? (
          <p className="text-sm text-paper-dim">
            Nothing open. A rare and pleasant state.
          </p>
        ) : (
          <ul className="divide-y divide-ink-hair">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <span className="text-paper">{t.title}</span>
                <span className="text-xs text-paper-faint">
                  {formatTaskDate(t.due_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
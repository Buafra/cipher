import { db, USER_ID } from "@/lib/supabase";
import { TaskList } from "@/components/TaskList";
import type { Task } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const { data } = await db
    .from("tasks")
    .select("*")
    .eq("user_id", USER_ID)
    .order("status", { ascending: true })
    .order("due_at", { ascending: true, nullsFirst: false });

  return (
    <>
      <p className="eyebrow">Tasks</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-paper">
        On your plate
      </h1>
      <p className="mt-3 max-w-2xl text-paper-dim">
        Add what needs doing. Anything with a due date is swept into your morning
        briefing and triggers a reminder as it approaches.
      </p>

      <div className="mt-10">
        <TaskList initialTasks={(data ?? []) as Task[]} />
      </div>
    </>
  );
}
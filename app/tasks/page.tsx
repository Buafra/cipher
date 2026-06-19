import { Eyebrow } from "@/components/Card";
import { TaskList } from "@/components/TaskList";
import { db, USER_ID } from "@/lib/supabase";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadTasks(): Promise<Task[]> {
  const { data } = await db
    .from("tasks")
    .select("*")
    .eq("user_id", USER_ID)
    .order("status", { ascending: true })
    .order("due_at", { ascending: true, nullsFirst: false });
  return (data ?? []) as Task[];
}

export default async function TasksPage() {
  const tasks = await loadTasks();
  return (
    <div className="space-y-8">
      <div>
        <Eyebrow>Tasks</Eyebrow>
        <h1 className="font-display text-2xl font-light text-paper">On your plate</h1>
        <p className="mt-1 text-sm text-paper-dim">
          Add what needs doing. Anything with a due date is swept into your morning
          briefing and triggers a reminder as it approaches.
        </p>
      </div>
      <TaskList initialTasks={tasks} />
    </div>
  );
}

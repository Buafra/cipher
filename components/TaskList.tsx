"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/lib/types";

export function TaskList({ initialTasks = [] }: { initialTasks?: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadTasks() {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      const data = await res.json();

      if (res.ok) {
        setTasks(data.tasks ?? []);
      }
    }

    loadTasks();
  }, []);

  async function addTask() {
    const t = title.trim();
    if (!t || busy) return;

    setBusy(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: t,
          due_at: due ? new Date(due).toISOString() : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTasks((prev) => [...prev, data.task]);
        setTitle("");
        setDue("");
      } else {
        alert(data.error ?? "Failed to create task");
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggle(task: Task) {
    const next = task.status === "done" ? "open" : "done";

    setTasks((prev) =>
      prev.map((x) =>
        x.id === task.id ? { ...x, status: next } : x
      )
    );

    await fetch("/api/tasks", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: task.id,
        status: next,
      }),
    });
  }

  async function remove(id: string) {
    setTasks((prev) => prev.filter((x) => x.id !== id));

    await fetch("/api/tasks", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
  }

  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-8">
      {/* Add Task */}
      <div className="rounded-xl border hairline bg-ink-raised p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="e.g. Renew passport"
            className="flex-1 rounded-lg bg-ink px-3 py-2 text-paper placeholder:text-paper-faint focus:outline-none"
          />

          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="rounded-lg bg-ink px-3 py-2 text-paper-dim focus:outline-none"
          />

          <button
            onClick={addTask}
            disabled={busy || !title.trim()}
            className="rounded-lg bg-brass px-4 py-2 text-sm font-medium text-ink disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>

      {/* Open Tasks */}
      <div>
        <h2 className="eyebrow mb-3">Open</h2>

        {open.length === 0 ? (
          <p className="text-sm text-paper-dim">
            Nothing open. A rare and pleasant state.
          </p>
        ) : (
          <ul className="divide-y divide-ink-hair">
            {open.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 py-3"
              >
                <button
                  onClick={() => toggle(t)}
                  aria-label="Mark done"
                  className="h-4 w-4 shrink-0 rounded-full border border-paper-faint hover:border-brass"
                />

                <span className="flex-1 text-paper">
                  {t.title}
                </span>

              {t.due_at && (
  <span className="text-xs text-paper-faint">
    {new Date(t.due_at).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })}
  </span>
)}

                <button
                  onClick={() => remove(t.id)}
                  className="text-xs text-paper-faint hover:text-paper"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Done Tasks */}
      {done.length > 0 && (
        <div>
          <h2 className="eyebrow mb-3">Done</h2>

          <ul className="divide-y divide-ink-hair">
            {done.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 py-3"
              >
                <button
                  onClick={() => toggle(t)}
                  aria-label="Mark open"
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brass text-[10px] text-ink"
                >
                  ✓
                </button>

                <span className="flex-1 text-paper-faint line-through">
                  {t.title}
                </span>

                <button
                  onClick={() => remove(t.id)}
                  className="text-xs text-paper-faint hover:text-paper"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
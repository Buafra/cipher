// Shared shapes used across the app. Mirrors the database schema.

export type MemoryFact = {
  id: string;
  user_id: string;
  category: string;
  fact: string;
  source: "user" | "inferred";
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  notes: string;
  due_at: string | null;
  status: "open" | "done";
  created_at: string;
};

export type Alert = {
  id: string;
  user_id: string;
  kind: "finance" | "task" | "health" | "system";
  title: string;
  body: string;
  severity: "info" | "warn" | "urgent";
  read: boolean;
  expires_at: string | null;
  created_at: string;
};

export type Briefing = {
  id: string;
  user_id: string;
  for_date: string;
  content: string;
  created_at: string;
};

export type Profile = {
  user_id: string;
  briefing: string;
  updated_at: string;
};

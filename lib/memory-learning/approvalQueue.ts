import type { MemoryApprovalItem, MemoryChange } from "./types";

const approvalQueue: MemoryApprovalItem[] = [];

export function addToApprovalQueue(changes: MemoryChange[]): MemoryApprovalItem[] {
  const items = changes
    .filter((change) => change.changeType !== "duplicate")
    .map((change) => ({
      id: crypto.randomUUID(),
      status: "pending" as const,
      change,
      createdAt: new Date().toISOString(),
    }));

  approvalQueue.push(...items);
  return items;
}

export function getApprovalQueue(): MemoryApprovalItem[] {
  return approvalQueue;
}

export function reviewApprovalItem(input: {
  id: string;
  status: "approved" | "rejected";
}): MemoryApprovalItem | null {
  const item = approvalQueue.find((entry) => entry.id === input.id);
  if (!item) return null;

  item.status = input.status;
  item.reviewedAt = new Date().toISOString();

  return item;
}
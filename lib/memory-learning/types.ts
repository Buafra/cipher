export type MemoryFactType =
  | "profile"
  | "project"
  | "decision"
  | "travel"
  | "health"
  | "finance"
  | "general";

export type ExtractedMemoryFact = {
  type: MemoryFactType;
  title: string;
  value: string;
  source?: string;
  confidence: number;
};

export type MemoryChangeType = "new" | "update" | "conflict" | "duplicate";

export type MemoryChange = {
  changeType: MemoryChangeType;
  fact: ExtractedMemoryFact;
  existingMemory?: string;
  recommendation: string;
};

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type MemoryApprovalItem = {
  id: string;
  status: ApprovalStatus;
  change: MemoryChange;
  createdAt: string;
  reviewedAt?: string;
};
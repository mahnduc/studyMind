// FILE: core/agent/human/types.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: Kiểu dữ liệu cho human-in-the-loop module

export type ApprovalStatus = "pending" | "approved" | "rejected" | "timed_out";

export interface ApprovalAuditEntry {
  approvalId: string;
  sessionId: string;
  capabilityId: string;
  status: ApprovalStatus;
  requestedAt: number;
  resolvedAt?: number;
  reason?: string;
}

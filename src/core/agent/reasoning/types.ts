// FILE: core/agent/reasoning/types.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: Các kiểu dữ liệu phụ trợ cho reasoning loop

export type ReasoningStepType = "think" | "act" | "observe" | "done" | "error";

export interface ReasoningTrace {
  runId: string;
  sessionId: string;
  capabilityId: string;
  steps: Array<{
    type: ReasoningStepType;
    content: string;
    toolName?: string;
    toolInput?: Record<string, unknown>;
    toolOutput?: unknown;
    iteration: number;
    timestampMs: number;
  }>;
  totalIterations: number;
  durationMs: number;
  success: boolean;
}

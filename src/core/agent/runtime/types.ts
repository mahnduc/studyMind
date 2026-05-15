// FILE: core/agent/runtime/types.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: Định nghĩa các kiểu dữ liệu cốt lõi dùng xuyên suốt hệ thống runtime

export type AgentState =
  | "idle"
  | "classifying"
  | "planning"
  | "executing"
  | "awaiting_human"
  | "streaming"
  | "completed"
  | "error";

export type ExecutionMode = "direct" | "workflow" | "reasoning";

export interface RuntimeOptions {
  maxIterations?: number;
  streamingEnabled?: boolean;
  humanInTheLoop?: boolean;
  timeoutMs?: number;
  debug?: boolean;
}

export interface RuntimeEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  sessionId: string;
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  toolCalls?: ToolCallRecord[];
}

export interface ToolCallRecord {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  durationMs: number;
}

export interface StreamChunk {
  type: "text" | "tool_call" | "tool_result" | "done" | "error";
  content: string;
  metadata?: Record<string, unknown>;
}

export interface AgentMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolName?: string;
  timestamp: number;
}

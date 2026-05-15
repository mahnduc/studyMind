
// FILE: core/agent/workflows/types.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: Interface cho WorkflowDefinition và trạng thái thực thi workflow.
//        Không import bất kỳ workflow cụ thể nào.

import { ConversationSession } from "../runtime/session";
import { RuntimeContext } from "../runtime/context";
import { StreamChunk, ExecutionResult } from "../runtime/types";

export interface WorkflowStepResult {
  stepId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  /** Nếu true, workflow kết thúc sớm */
  abort?: boolean;
}

export interface WorkflowExecutionState {
  workflowId: string;
  currentStepIndex: number;
  completedSteps: WorkflowStepResult[];
  context: Record<string, unknown>; // dữ liệu chia sẻ giữa các step
}

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  /**
   * Thực thi step này.
   * Nhận state hiện tại của workflow để đọc kết quả các bước trước.
   */
  execute(
    state: WorkflowExecutionState,
    session: ConversationSession,
    ctx: RuntimeContext,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<WorkflowStepResult>;
}

export interface WorkflowDefinition {
  /** ID duy nhất */
  id: string;

  /** Tên hiển thị */
  name: string;

  /** Mô tả mục đích */
  description: string;

  /** Danh sách các bước thực hiện theo thứ tự */
  steps: WorkflowStep[];

  /** Có thể resume sau khi bị gián đoạn không */
  resumable?: boolean;

  /** Metadata mở rộng */
  meta?: Record<string, unknown>;
}

export interface WorkflowRunResult extends ExecutionResult {
  workflowId: string;
  completedSteps: WorkflowStepResult[];
  abortedAtStep?: string;
}

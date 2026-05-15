// FILE: core/agent/capabilities/types.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: Định nghĩa interface cho một Capability.
//        File này KHÔNG import bất kỳ capability cụ thể nào.

import { ExecutionMode } from "../runtime/types";

export interface CapabilityDefinition {
  /** ID duy nhất, dùng để tra cứu trong registry */
  id: string;

  /** Tên hiển thị */
  name: string;

  /** Mô tả mục đích - Supervisor đọc để phân loại intent */
  description: string;

  /** Các ví dụ câu hỏi kích hoạt capability này - dùng cho few-shot */
  triggerExamples: string[];

  /** Execution mode mặc định */
  defaultMode: ExecutionMode;

  /** Danh sách tool IDs mà capability này có quyền dùng */
  allowedToolIds: string[];

  /** Workflow ID nếu mode là "workflow" */
  workflowId?: string;

  /** Có yêu cầu phê duyệt của người dùng trước khi thực thi không */
  requiresApproval?: boolean;

  /** System prompt riêng cho capability này (optional - override global) */
  systemPromptOverride?: string;

  /** Metadata mở rộng tùy nghiệp vụ */
  meta?: Record<string, unknown>;
}

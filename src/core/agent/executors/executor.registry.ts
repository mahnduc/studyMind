// FILE: core/agent/executors/executor.registry.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: ExecutorRegistry - ánh xạ ExecutionMode sang Executor tương ứng.
//        Không biết về bất kỳ executor cụ thể nào.

import { ExecutionMode, ExecutionResult, StreamChunk } from "../runtime/types";
import { CapabilityDefinition } from "../capabilities/types";
import { ConversationSession } from "../runtime/session";
import { RuntimeContext } from "../runtime/context";

// ── Executor Interface ────────────────────────────────────────

export interface ExecutorInput {
  capability: CapabilityDefinition;
  userInput: string;
  session: ConversationSession;
  ctx: RuntimeContext;
  onChunk?: (chunk: StreamChunk) => void;
}

/**
 * Interface mà mọi Executor phải implement.
 * Direct, Reasoning, Workflow mỗi loại có cách thực thi khác nhau
 * nhưng cùng chung interface này.
 */
export interface Executor {
  readonly mode: ExecutionMode;
  execute(input: ExecutorInput): Promise<ExecutionResult>;
}

// ── Registry ──────────────────────────────────────────────────

export class ExecutorRegistry {
  private readonly store: Map<ExecutionMode, Executor> = new Map();

  /**
   * Đăng ký executor cho một mode.
   * Gọi trong bootstrap - không gọi từ runtime trực tiếp.
   */
  register(executor: Executor): void {
    if (this.store.has(executor.mode)) {
      console.warn(
        `[ExecutorRegistry] Overwriting executor for mode: "${executor.mode}"`
      );
    }
    this.store.set(executor.mode, executor);
  }

  /**
   * Lấy executor cho mode cụ thể.
   */
  get(mode: ExecutionMode): Executor | undefined {
    return this.store.get(mode);
  }

  has(mode: ExecutionMode): boolean {
    return this.store.has(mode);
  }

  listModes(): ExecutionMode[] {
    return Array.from(this.store.keys());
  }

  size(): number {
    return this.store.size;
  }
}

// Singleton
export const executorRegistry = new ExecutorRegistry();

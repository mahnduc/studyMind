// FILE: core/agent/runtime/runtime.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: AgentRuntime - Kernel điều phối trung tâm.
//        Không biết về bất kỳ capability, tool, hay workflow cụ thể nào.
//        Vận hành hoàn toàn dựa trên registry và interface abstractions.

import { EventEmitter } from "./event-emitter";
import { RuntimeContext } from "./context";
import { ConversationSession, SessionStore } from "./session";
import {
  AgentState,
  ExecutionResult,
  RuntimeOptions,
  StreamChunk,
} from "./types";
import { CapabilityRegistry } from "../capabilities/registry";
import { ExecutorRegistry } from "../executors/executor.registry";
import { Supervisor } from "../supervisor/supervisor";
import { HumanApprovalManager } from "../human/approval-manager";

export interface AgentRuntimeDeps {
  capabilityRegistry: CapabilityRegistry;
  executorRegistry: ExecutorRegistry;
  supervisor: Supervisor;
  approvalManager: HumanApprovalManager;
  events?: EventEmitter;
}

export class AgentRuntime {
  private readonly capabilityRegistry: CapabilityRegistry;
  private readonly executorRegistry: ExecutorRegistry;
  private readonly supervisor: Supervisor;
  private readonly approvalManager: HumanApprovalManager;
  private readonly events: EventEmitter;
  private readonly sessionStore: SessionStore;

  constructor(deps: AgentRuntimeDeps) {
    this.capabilityRegistry = deps.capabilityRegistry;
    this.executorRegistry = deps.executorRegistry;
    this.supervisor = deps.supervisor;
    this.approvalManager = deps.approvalManager;
    this.events = deps.events ?? new EventEmitter();
    this.sessionStore = new SessionStore();
  }

  // ── Public API ────────────────────────────────────────────

  /**
   * Xử lý một lượt input từ người dùng.
   * Stream từng chunk qua callback.
   */
  async run(
    sessionId: string,
    userInput: string,
    options: RuntimeOptions = {},
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<ExecutionResult> {
    const session = this.sessionStore.getOrCreate(sessionId);
    const ctx = new RuntimeContext(sessionId, options, this.events);

    await ctx.setState("classifying");
    session.addUserMessage(userInput);

    await this.events.emit("run:started", {
      sessionId,
      runId: ctx.runId,
      userInput,
      timestamp: ctx.startedAt,
    });

    try {
      const result = await this._executeLoop(ctx, session, userInput, onChunk);

      const finalState: AgentState = result.success ? "completed" : "error";
      await ctx.setState(finalState);

      if (result.output) {
        session.addAssistantMessage(result.output);
      }

      await this.events.emit("run:completed", {
        sessionId,
        runId: ctx.runId,
        result,
        snapshot: ctx.snapshot(),
      });

      return result;
    } catch (err) {
      await ctx.setState("error");
      const errorMsg =
        err instanceof Error ? err.message : "Unknown runtime error";

      await this.events.emit("run:error", {
        sessionId,
        runId: ctx.runId,
        error: errorMsg,
        snapshot: ctx.snapshot(),
      });

      return { success: false, error: errorMsg };
    }
  }

  /**
   * Lấy session hiện có (để UI truy vấn lịch sử).
   */
  getSession(sessionId: string): ConversationSession | undefined {
    return this.sessionStore.get(sessionId);
  }

  /**
   * Lấy hoặc tạo session mới.
   */
  getOrCreateSession(sessionId: string): ConversationSession {
    return this.sessionStore.getOrCreate(sessionId);
  }

  /**
   * Xóa session và giải phóng bộ nhớ.
   */
  destroySession(sessionId: string): void {
    this.sessionStore.delete(sessionId);
    this.events.emit("session:destroyed", { sessionId });
  }

  /**
   * Đăng ký lắng nghe các sự kiện runtime.
   */
  on<T = unknown>(
    eventType: string,
    handler: (event: T) => void | Promise<void>
  ): () => void {
    return this.events.on<T>(eventType, handler);
  }

  // ── Private execution loop ────────────────────────────────

  private async _executeLoop(
    ctx: RuntimeContext,
    session: ConversationSession,
    userInput: string,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<ExecutionResult> {
    // Giới hạn vòng lặp - máy trạng thái
    while (!ctx.hasExceededMaxIterations() && !ctx.hasTimedOut()) {
      ctx.incrementIteration();

      // 1. Supervisor phân loại intent và chọn capability
      await ctx.setState("classifying");
      const supervision = await this.supervisor.supervise(
        userInput,
        session.toLLMMessages(),
        this.capabilityRegistry.listAll()
      );

      ctx.setSelectedCapability(supervision.capabilityId);
      ctx.setMode(supervision.mode);

      await this.events.emit("supervisor:decided", {
        sessionId: ctx.sessionId,
        runId: ctx.runId,
        supervision,
      });

      // 2. Kiểm tra human-in-the-loop nếu cần
      if (ctx.options.humanInTheLoop && supervision.requiresApproval) {
        await ctx.setState("awaiting_human");
        const approved = await this.approvalManager.requestApproval({
          sessionId: ctx.sessionId,
          capabilityId: supervision.capabilityId,
          reason: supervision.approvalReason ?? "Action requires confirmation",
          context: ctx.snapshot(),
        });

        if (!approved) {
          return {
            success: false,
            error: "Action rejected by user",
          };
        }
      }

      // 3. Lấy executor phù hợp với mode
      const executor = this.executorRegistry.get(supervision.mode);
      if (!executor) {
        return {
          success: false,
          error: `No executor registered for mode: ${supervision.mode}`,
        };
      }

      // 4. Lấy capability definition
      const capability = this.capabilityRegistry.get(supervision.capabilityId);
      if (!capability) {
        return {
          success: false,
          error: `Capability not found: ${supervision.capabilityId}`,
        };
      }

      // 5. Thực thi
      await ctx.setState("executing");
      const result = await executor.execute({
        capability,
        userInput,
        session,
        ctx,
        onChunk,
      });

      // 6. Nếu executor yêu cầu thêm vòng lặp (reasoning tiếp tục)
      if (result.metadata?.continueLoop === true) {
        continue;
      }

      return result;
    }

    if (ctx.hasTimedOut()) {
      return { success: false, error: "Execution timed out" };
    }

    return {
      success: false,
      error: `Max iterations (${ctx.options.maxIterations}) exceeded`,
    };
  }
}

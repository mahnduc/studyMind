// FILE: core/agent/runtime/context.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: RuntimeContext - Đối tượng ngữ cảnh bất biến được truyền xuyên suốt
//        một chu kỳ thực thi. Không chứa logic nghiệp vụ.

import { EventEmitter } from "./event-emitter";
import { AgentState, ExecutionMode, RuntimeOptions } from "./types";

export interface RuntimeContextSnapshot {
  sessionId: string;
  runId: string;
  state: AgentState;
  mode: ExecutionMode | null;
  selectedCapabilityId: string | null;
  iterationCount: number;
  startedAt: number;
  options: RuntimeOptions;
  metadata: Record<string, unknown>;
}

export class RuntimeContext {
  readonly sessionId: string;
  readonly runId: string;
  readonly startedAt: number;
  readonly options: RuntimeOptions;
  readonly events: EventEmitter;

  private _state: AgentState = "idle";
  private _mode: ExecutionMode | null = null;
  private _selectedCapabilityId: string | null = null;
  private _iterationCount = 0;
  private _metadata: Record<string, unknown> = {};

  constructor(
    sessionId: string,
    options: RuntimeOptions = {},
    events: EventEmitter
  ) {
    this.sessionId = sessionId;
    this.runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.startedAt = Date.now();
    this.options = {
      maxIterations: 10,
      streamingEnabled: true,
      humanInTheLoop: false,
      timeoutMs: 60_000,
      debug: false,
      ...options,
    };
    this.events = events;
  }

  // ── Getters ──────────────────────────────────────────────

  get state(): AgentState {
    return this._state;
  }

  get mode(): ExecutionMode | null {
    return this._mode;
  }

  get selectedCapabilityId(): string | null {
    return this._selectedCapabilityId;
  }

  get iterationCount(): number {
    return this._iterationCount;
  }

  get metadata(): Readonly<Record<string, unknown>> {
    return { ...this._metadata };
  }

  // ── Mutations (chỉ runtime nội bộ được gọi) ──────────────

  /** Chuyển trạng thái máy - emits sự kiện "state:changed" */
  async setState(next: AgentState): Promise<void> {
    const prev = this._state;
    this._state = next;
    await this.events.emit("state:changed", {
      sessionId: this.sessionId,
      runId: this.runId,
      prev,
      next,
      timestamp: Date.now(),
    });
  }

  setMode(mode: ExecutionMode): void {
    this._mode = mode;
  }

  setSelectedCapability(capabilityId: string): void {
    this._selectedCapabilityId = capabilityId;
  }

  incrementIteration(): void {
    this._iterationCount++;
  }

  setMetadata(key: string, value: unknown): void {
    this._metadata[key] = value;
  }

  // ── Utilities ────────────────────────────────────────────

  hasExceededMaxIterations(): boolean {
    return this._iterationCount >= (this.options.maxIterations ?? 10);
  }

  hasTimedOut(): boolean {
    return Date.now() - this.startedAt > (this.options.timeoutMs ?? 60_000);
  }

  snapshot(): RuntimeContextSnapshot {
    return {
      sessionId: this.sessionId,
      runId: this.runId,
      state: this._state,
      mode: this._mode,
      selectedCapabilityId: this._selectedCapabilityId,
      iterationCount: this._iterationCount,
      startedAt: this.startedAt,
      options: this.options,
      metadata: { ...this._metadata },
    };
  }
}

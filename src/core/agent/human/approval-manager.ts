// FILE: core/agent/human/approval-manager.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: HumanApprovalManager - quản lý vòng chờ phê duyệt của người dùng.
//        Không biết về loại action cụ thể, chỉ quản lý cơ chế approval.
//        Sử dụng Promise-based pending queue để chờ phản hồi.

import { EventEmitter } from "../runtime/event-emitter";
import { RuntimeContextSnapshot } from "../runtime/context";

export interface ApprovalRequest {
  sessionId: string;
  capabilityId: string;
  reason: string;
  context: RuntimeContextSnapshot;
  /** Timeout ms trước khi tự động reject (default: 5 phút) */
  timeoutMs?: number;
}

export interface ApprovalResponse {
  approved: boolean;
  rejectionReason?: string;
  approvedAt?: number;
}

interface PendingApproval {
  request: ApprovalRequest;
  resolve: (approved: boolean) => void;
  reject: (err: Error) => void;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

export class HumanApprovalManager {
  private readonly events: EventEmitter;
  private readonly pending: Map<string, PendingApproval> = new Map();
  private readonly defaultTimeoutMs: number;

  constructor(events: EventEmitter, defaultTimeoutMs = 5 * 60 * 1000) {
    this.events = events;
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  /**
   * Tạo một yêu cầu phê duyệt và chờ phản hồi từ người dùng.
   * Phát sự kiện "approval:requested" để UI hiển thị dialog.
   * Trả về true nếu được chấp thuận, false nếu từ chối hoặc timeout.
   */
  async requestApproval(request: ApprovalRequest): Promise<boolean> {
    const approvalId = `approval_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const timeoutMs = request.timeoutMs ?? this.defaultTimeoutMs;

    const approved = await new Promise<boolean>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pending.delete(approvalId);
        resolve(false); // Auto-reject on timeout
      }, timeoutMs);

      this.pending.set(approvalId, {
        request,
        resolve,
        reject,
        timeoutHandle,
      });
    });

    // Emit sự kiện để các module khác biết kết quả
    await this.events.emit("approval:requested", {
      approvalId,
      request,
      timeoutMs,
    });

    return approved;
  }

  /**
   * Người dùng phê duyệt - gọi từ UI khi nhấn "Confirm".
   */
  async approve(approvalId: string): Promise<void> {
    const pending = this.pending.get(approvalId);
    if (!pending) {
      console.warn(
        `[ApprovalManager] No pending approval found for id: "${approvalId}"`
      );
      return;
    }

    clearTimeout(pending.timeoutHandle);
    this.pending.delete(approvalId);
    pending.resolve(true);

    await this.events.emit("approval:granted", {
      approvalId,
      sessionId: pending.request.sessionId,
      approvedAt: Date.now(),
    });
  }

  /**
   * Người dùng từ chối - gọi từ UI khi nhấn "Cancel".
   */
  async reject(approvalId: string, reason?: string): Promise<void> {
    const pending = this.pending.get(approvalId);
    if (!pending) {
      console.warn(
        `[ApprovalManager] No pending approval found for id: "${approvalId}"`
      );
      return;
    }

    clearTimeout(pending.timeoutHandle);
    this.pending.delete(approvalId);
    pending.resolve(false);

    await this.events.emit("approval:rejected", {
      approvalId,
      sessionId: pending.request.sessionId,
      reason: reason ?? "Rejected by user",
      rejectedAt: Date.now(),
    });
  }

  /**
   * Lấy danh sách các approval đang chờ (để UI hiển thị).
   */
  listPending(): Array<{ approvalId: string; request: ApprovalRequest }> {
    return Array.from(this.pending.entries()).map(([approvalId, p]) => ({
      approvalId,
      request: p.request,
    }));
  }

  /**
   * Hủy tất cả approvals đang chờ - dùng khi session bị destroy.
   */
  cancelAll(sessionId: string): void {
    for (const [id, pending] of this.pending.entries()) {
      if (pending.request.sessionId === sessionId) {
        clearTimeout(pending.timeoutHandle);
        pending.resolve(false);
        this.pending.delete(id);
      }
    }
  }

  hasPending(approvalId: string): boolean {
    return this.pending.has(approvalId);
  }

  pendingCount(): number {
    return this.pending.size;
  }
}

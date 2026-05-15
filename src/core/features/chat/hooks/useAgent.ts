// core/features/chat/hooks/useAgent.ts
// MÔ TẢ: Hook kết nối React UI với AgentRuntime.
//        Component chỉ dùng hook này, không gọi runtime trực tiếp.
//        Xử lý: streaming, state tracking, approval dialog, error.

import { useState, useEffect, useCallback, useRef } from "react";
import { AgentRuntime } from "../../../agent/runtime/runtime";
import { AgentState, StreamChunk } from "../../../agent/runtime/types";
import { AgentMessage } from "../../../agent/runtime/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolName?: string;
  toolCallId?: string;
}

export interface PendingApproval {
  approvalId: string;
  capabilityId: string;
  reason: string;
}

export interface UseAgentReturn {
  /** Danh sách tin nhắn hiển thị trong UI */
  messages: ChatMessage[];
  /** Trạng thái hiện tại của agent */
  agentState: AgentState;
  /** Agent đang xử lý (bất kỳ state nào != idle/completed/error) */
  isProcessing: boolean;
  /** Có đang stream text không */
  isStreaming: boolean;
  /** Approval đang chờ xử lý (nếu có) */
  pendingApproval: PendingApproval | null;
  /** Lỗi cuối cùng (nếu có) */
  error: string | null;
  /** Gửi tin nhắn */
  send: (input: string) => Promise<void>;
  /** Chấp thuận approval request */
  approve: (approvalId: string) => Promise<void>;
  /** Từ chối approval request */
  reject: (approvalId: string, reason?: string) => Promise<void>;
  /** Xóa lịch sử chat */
  clearMessages: () => void;
  /** Xóa lỗi */
  clearError: () => void;
}

// ── Hook ──────────────────────────────────────────────────────

export function useAgent(
  runtime: AgentRuntime,
  sessionId: string
): UseAgentReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ref để track streaming message ID đang active
  const streamingMsgIdRef = useRef<string | null>(null);

  // ── Subscribe runtime events ─────────────────────────────

  useEffect(() => {
    // Lắng nghe thay đổi trạng thái agent
    const unsubState = runtime.on<{
      sessionId: string;
      prev: AgentState;
      next: AgentState;
    }>("state:changed", ({ sessionId: sid, next }) => {
      if (sid !== sessionId) return;
      setAgentState(next);

      // Reset streaming message khi hoàn thành hoặc lỗi
      if (next === "completed" || next === "error" || next === "idle") {
        streamingMsgIdRef.current = null;
        setMessages((prev) =>
          prev.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          )
        );
      }
    });

    // Lắng nghe approval requests
    const unsubApproval = runtime.on<{
      approvalId: string;
      request: {
        sessionId: string;
        capabilityId: string;
        reason: string;
      };
    }>("approval:requested", ({ approvalId, request }) => {
      if (request.sessionId !== sessionId) return;
      setPendingApproval({
        approvalId,
        capabilityId: request.capabilityId,
        reason: request.reason,
      });
    });

    // Xóa approval khi được resolve
    const unsubApprovalGranted = runtime.on<{ approvalId: string }>(
      "approval:granted",
      () => setPendingApproval(null)
    );

    const unsubApprovalRejected = runtime.on<{ approvalId: string }>(
      "approval:rejected",
      () => setPendingApproval(null)
    );

    // Load lại messages từ session khi mount (nếu session đã tồn tại)
    const existingSession = runtime.getSession(sessionId);
    if (existingSession) {
      const loaded = existingSession.messages.map((m) =>
        agentMsgToChatMsg(m)
      );
      setMessages(loaded);
    }

    return () => {
      unsubState();
      unsubApproval();
      unsubApprovalGranted();
      unsubApprovalRejected();
    };
  }, [runtime, sessionId]);

  // ── send ─────────────────────────────────────────────────

  const send = useCallback(
    async (input: string) => {
      if (!input.trim()) return;
      setError(null);

      // Thêm user message ngay lập tức
      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: input.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Tạo placeholder cho assistant message (streaming)
      const assistantMsgId = generateId();
      streamingMsgIdRef.current = assistantMsgId;

      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Callback nhận từng chunk stream
      const onChunk = (chunk: StreamChunk) => {
        if (chunk.type === "text" && streamingMsgIdRef.current === assistantMsgId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + chunk.content }
                : m
            )
          );
        }

        if (chunk.type === "tool_result") {
          // Thêm tool result message để hiển thị
          const toolMsg: ChatMessage = {
            id: generateId(),
            role: "tool",
            content: chunk.content,
            timestamp: Date.now(),
            toolName: chunk.metadata?.toolName as string | undefined,
          };
          setMessages((prev) => {
            // Chèn tool message trước assistant streaming message
            const idx = prev.findIndex((m) => m.id === assistantMsgId);
            if (idx === -1) return [...prev, toolMsg];
            const next = [...prev];
            next.splice(idx, 0, toolMsg);
            return next;
          });
        }
      };

      try {
        const result = await runtime.run(
          sessionId,
          input.trim(),
          { streamingEnabled: true },
          onChunk
        );

        if (!result.success && result.error) {
          setError(result.error);
          // Xóa placeholder nếu lỗi và không có content
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId && m.content === ""
                ? { ...m, content: `${result.error}`, isStreaming: false }
                : { ...m, isStreaming: false }
            )
          );
        } else {
          // Nếu output có nhưng stream không hoạt động, set content từ result
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantMsgId) return m;
              const content =
                m.content !== "" ? m.content : (result.output ?? "");
              return { ...m, content, isStreaming: false };
            })
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: `${msg}`, isStreaming: false }
              : m
          )
        );
      } finally {
        streamingMsgIdRef.current = null;
      }
    },
    [runtime, sessionId]
  );

  // ── approve / reject ──────────────────────────────────────

  const approve = useCallback(
    async (approvalId: string) => {
      // ApprovalManager được access qua runtime events
      // UI gửi event ngược lại để resolve
      await runtime.on("_internal:noop", () => {})(); // type-safe noop
      // Thực tế: cần expose approvalManager hoặc dùng event bus
      // Xem note bên dưới về cách wire approvalManager
      runtime["approvalManager" as keyof typeof runtime] &&
        (runtime as unknown as { approvalManager: { approve: (id: string) => Promise<void> } })
          .approvalManager.approve(approvalId);
    },
    [runtime]
  );

  const reject = useCallback(
    async (approvalId: string, reason?: string) => {
      runtime["approvalManager" as keyof typeof runtime] &&
        (runtime as unknown as { approvalManager: { reject: (id: string, r?: string) => Promise<void> } })
          .approvalManager.reject(approvalId, reason);
    },
    [runtime]
  );

  // ── utilities ─────────────────────────────────────────────

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    runtime.getSession(sessionId)?.clear();
  }, [runtime, sessionId]);

  const clearError = useCallback(() => setError(null), []);

  // ── Derived state ─────────────────────────────────────────

  const isStreaming = agentState === "streaming";
  const isProcessing =
    agentState !== "idle" &&
    agentState !== "completed" &&
    agentState !== "error";

  return {
    messages,
    agentState,
    isProcessing,
    isStreaming,
    pendingApproval,
    error,
    send,
    approve,
    reject,
    clearMessages,
    clearError,
  };
}

// ── Helpers ───────────────────────────────────────────────────

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function agentMsgToChatMsg(m: AgentMessage): ChatMessage {
  return {
    id: generateId(),
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
    toolName: m.toolName,
    toolCallId: m.toolCallId,
  };
}
// FILE: core/agent/runtime/session.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: ConversationSession - quản lý lịch sử hội thoại, trung lập nghiệp vụ

import { AgentMessage } from "./types";

export interface SessionSnapshot {
  sessionId: string;
  messages: AgentMessage[];
  createdAt: number;
  updatedAt: number;
  turnCount: number;
}

export class ConversationSession {
  readonly sessionId: string;
  readonly createdAt: number;

  private _messages: AgentMessage[] = [];
  private _updatedAt: number;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.createdAt = Date.now();
    this._updatedAt = Date.now();
  }

  // ── Truy vấn ─────────────────────────────────────────────

  get messages(): ReadonlyArray<AgentMessage> {
    return this._messages;
  }

  get turnCount(): number {
    return this._messages.filter((m) => m.role === "user").length;
  }

  get lastMessage(): AgentMessage | null {
    return this._messages[this._messages.length - 1] ?? null;
  }

  /** Lấy N message cuối - dùng để xây context window */
  getRecentMessages(limit = 20): AgentMessage[] {
    return this._messages.slice(-limit);
  }

  /** Chuyển đổi lịch sử sang định dạng LLM messages (role/content pairs) */
  toLLMMessages(
    limit = 20
  ): Array<{ role: "user" | "assistant"; content: string }> {
    return this.getRecentMessages(limit)
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
  }

  // ── Mutations ─────────────────────────────────────────────

  addMessage(message: Omit<AgentMessage, "timestamp">): AgentMessage {
    const full: AgentMessage = {
      ...message,
      timestamp: Date.now(),
    };
    this._messages.push(full);
    this._updatedAt = Date.now();
    return full;
  }

  addUserMessage(content: string): AgentMessage {
    return this.addMessage({ role: "user", content });
  }

  addAssistantMessage(content: string): AgentMessage {
    return this.addMessage({ role: "assistant", content });
  }

  addToolMessage(
    content: string,
    toolName: string,
    toolCallId: string
  ): AgentMessage {
    return this.addMessage({ role: "tool", content, toolName, toolCallId });
  }

  /** Xóa lịch sử hội thoại, bắt đầu lại */
  clear(): void {
    this._messages = [];
    this._updatedAt = Date.now();
  }

  // ── Serialization ─────────────────────────────────────────

  snapshot(): SessionSnapshot {
    return {
      sessionId: this.sessionId,
      messages: [...this._messages],
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      turnCount: this.turnCount,
    };
  }

  static fromSnapshot(snapshot: SessionSnapshot): ConversationSession {
    const session = new ConversationSession(snapshot.sessionId);
    snapshot.messages.forEach((m) => session._messages.push(m));
    return session;
  }
}

// ── SessionStore - quản lý nhiều session đồng thời ───────────

export class SessionStore {
  private sessions: Map<string, ConversationSession> = new Map();

  getOrCreate(sessionId: string): ConversationSession {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new ConversationSession(sessionId));
    }
    return this.sessions.get(sessionId)!;
  }

  get(sessionId: string): ConversationSession | undefined {
    return this.sessions.get(sessionId);
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  has(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  listSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  size(): number {
    return this.sessions.size;
  }
}

// core/storage/repositories/chat.repository.ts
// MÔ TẢ: Persistence cho chat sessions và messages

import { AgentMessage } from "../../agent/runtime/types";
import { pgliteAdapter } from "../pglite.adapter";

export interface PersistedSession {
  id: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  messages: AgentMessage[];
}

export const chatRepository = {
  async saveSession(
    sessionId: string,
    messages: AgentMessage[],
    title?: string
  ): Promise<void> {
    const now = Date.now();
    await pgliteAdapter.exec(
      `INSERT INTO chat_sessions (id, title, created_at, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET title = $2, updated_at = $4`,
      [sessionId, title ?? null, now, now]
    );

    // Xóa messages cũ và insert lại
    await pgliteAdapter.exec(
      `DELETE FROM chat_messages WHERE session_id = $1`,
      [sessionId]
    );

    for (const msg of messages) {
      const msgId = `${sessionId}_${msg.timestamp}_${Math.random().toString(36).slice(2, 6)}`;
      await pgliteAdapter.exec(
        `INSERT INTO chat_messages (id, session_id, role, content, tool_name, tool_call_id, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [msgId, sessionId, msg.role, msg.content, msg.toolName ?? null, msg.toolCallId ?? null, msg.timestamp]
      );
    }
  },

  async getSession(sessionId: string): Promise<PersistedSession | null> {
    const sessionRes = await pgliteAdapter.query<{
      id: string; title: string; created_at: number; updated_at: number;
    }>(
      `SELECT id, title, created_at, updated_at FROM chat_sessions WHERE id = $1`,
      [sessionId]
    );
    if (sessionRes.rowCount === 0) return null;

    const s = sessionRes.rows[0];
    const msgRes = await pgliteAdapter.query<{
      role: string; content: string; tool_name: string; tool_call_id: string; timestamp: number;
    }>(
      `SELECT role, content, tool_name, tool_call_id, timestamp
       FROM chat_messages WHERE session_id = $1 ORDER BY timestamp ASC`,
      [sessionId]
    );

    return {
      id: s.id,
      title: s.title,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      messages: msgRes.rows.map((m) => ({
        role: m.role as AgentMessage["role"],
        content: m.content,
        toolName: m.tool_name ?? undefined,
        toolCallId: m.tool_call_id ?? undefined,
        timestamp: m.timestamp,
      })),
    };
  },

  async listSessions(): Promise<Omit<PersistedSession, "messages">[]> {
    const res = await pgliteAdapter.query<{
      id: string; title: string; created_at: number; updated_at: number;
    }>(
      `SELECT id, title, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC`
    );
    return res.rows.map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));
  },

  async deleteSession(sessionId: string): Promise<void> {
    await pgliteAdapter.exec(
      `DELETE FROM chat_sessions WHERE id = $1`,
      [sessionId]
    );
  },
};
-- core/storage/migrations/003_create_chat_tables.sql
-- MÔ TẢ: Tạo bảng cho chat history persistence

CREATE TABLE IF NOT EXISTS chat_sessions (
  id         TEXT PRIMARY KEY,
  title      TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id           TEXT PRIMARY KEY,
  session_id   TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content      TEXT NOT NULL,
  tool_name    TEXT,
  tool_call_id TEXT,
  timestamp    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp   ON chat_messages(timestamp);
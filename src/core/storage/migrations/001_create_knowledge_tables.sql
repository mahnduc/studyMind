-- core/storage/migrations/001_create_knowledge_tables.sql
-- MÔ TẢ: Tạo bảng cho knowledge base (documents, chunks, embeddings)

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('pdf', 'markdown', 'txt')),
  content       TEXT NOT NULL DEFAULT '',
  size_bytes    INTEGER NOT NULL DEFAULT 0,
  uploaded_at   INTEGER NOT NULL,
  chunk_count   INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'indexing', 'ready', 'error')),
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS document_chunks (
  chunk_id      TEXT PRIMARY KEY,
  document_id   TEXT NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  content       TEXT NOT NULL,
  chunk_index   INTEGER NOT NULL,
  start_char    INTEGER NOT NULL DEFAULT 0,
  end_char      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chunk_embeddings (
  chunk_id    TEXT PRIMARY KEY REFERENCES document_chunks(chunk_id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  vector      TEXT NOT NULL,   -- JSON array of floats
  model       TEXT NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON chunk_embeddings(document_id);
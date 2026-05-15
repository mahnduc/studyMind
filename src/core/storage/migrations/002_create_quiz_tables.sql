-- core/storage/migrations/002_create_quiz_tables.sql
-- MÔ TẢ: Tạo bảng cho quiz domain

CREATE TABLE IF NOT EXISTS quizzes (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  source_document_id TEXT,
  question_count     INTEGER NOT NULL DEFAULT 0,
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id            TEXT PRIMARY KEY,
  quiz_id       TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  options       TEXT NOT NULL,   -- JSON array: [{id, text}]
  correct_id    TEXT NOT NULL,   -- option id của đáp án đúng
  explanation   TEXT,
  difficulty    TEXT NOT NULL DEFAULT 'medium'
                CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id          TEXT PRIMARY KEY,
  quiz_id     TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL DEFAULT 0,
  total       INTEGER NOT NULL DEFAULT 0,
  answers     TEXT NOT NULL DEFAULT '{}',  -- JSON: {questionId: selectedOptionId}
  started_at  INTEGER NOT NULL,
  finished_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON quiz_attempts(quiz_id);
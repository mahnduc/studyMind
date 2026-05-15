// core/storage/repositories/quiz.repository.ts
// MÔ TẢ: SQL persistence cho quizzes, questions, attempts

import { Question, Quiz, QuizAttempt } from "@/core/quiz/types";
import { pgliteAdapter } from "../pglite.adapter";

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const quizStorageRepository = {
  // ── Quizzes ─────────────────────────────────────────────

  async save(quiz: Omit<Quiz, "id"> & { id?: string }): Promise<string> {
    const id = quiz.id ?? `quiz_${generateId()}`;
    const now = Date.now();
    await pgliteAdapter.exec(
      `INSERT INTO quizzes (id, title, source_document_id, question_count, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET title=$2, updated_at=$6`,
      [id, quiz.title, quiz.sourceDocumentId ?? null,
       quiz.questions.length, quiz.createdAt ?? now, now]
    );
    // Lưu questions
    await pgliteAdapter.exec(`DELETE FROM questions WHERE quiz_id = $1`, [id]);
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      const qId = q.id ?? `q_${generateId()}`;
      await pgliteAdapter.exec(
        `INSERT INTO questions
           (id, quiz_id, content, options, correct_id, explanation, difficulty, question_index)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [qId, id, q.content, JSON.stringify(q.options),
         q.correctId, q.explanation ?? null, q.difficulty ?? "medium", i]
      );
    }
    return id;
  },

  async getById(quizId: string): Promise<Quiz | null> {
    const res = await pgliteAdapter.query<{
      id: string; title: string; source_document_id: string;
      question_count: number; created_at: number; updated_at: number;
    }>(`SELECT * FROM quizzes WHERE id = $1`, [quizId]);
    if (res.rowCount === 0) return null;
    const q = res.rows[0];

    const qRes = await pgliteAdapter.query<{
      id: string; content: string; options: string; correct_id: string;
      explanation: string; difficulty: string; question_index: number;
    }>(
      `SELECT * FROM questions WHERE quiz_id = $1 ORDER BY question_index`,
      [quizId]
    );

    return {
      id: q.id, title: q.title,
      sourceDocumentId: q.source_document_id ?? undefined,
      createdAt: q.created_at,
      questions: qRes.rows.map((r) => ({
        id: r.id, content: r.content,
        options: JSON.parse(r.options) as Question["options"],
        correctId: r.correct_id,
        explanation: r.explanation ?? undefined,
        difficulty: r.difficulty as Question["difficulty"],
      })),
    };
  },

  async list(): Promise<Omit<Quiz, "questions">[]> {
    const res = await pgliteAdapter.query<{
      id: string; title: string; source_document_id: string;
      question_count: number; created_at: number;
    }>(`SELECT id, title, source_document_id, question_count, created_at
        FROM quizzes ORDER BY created_at DESC`);
    return res.rows.map((q) => ({
      id: q.id, title: q.title,
      sourceDocumentId: q.source_document_id ?? undefined,
      createdAt: q.created_at, questions: [],
    }));
  },

  async delete(quizId: string): Promise<void> {
    await pgliteAdapter.exec(`DELETE FROM quizzes WHERE id = $1`, [quizId]);
  },

  // ── Attempts ────────────────────────────────────────────

  async saveAttempt(attempt: Omit<QuizAttempt, "id">): Promise<string> {
    const id = `attempt_${generateId()}`;
    await pgliteAdapter.exec(
      `INSERT INTO quiz_attempts (id, quiz_id, score, total, answers, started_at, finished_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, attempt.quizId, attempt.score, attempt.total,
       JSON.stringify(attempt.answers), attempt.startedAt, attempt.finishedAt ?? null]
    );
    return id;
  },

  async getAttemptsByQuizId(quizId: string): Promise<QuizAttempt[]> {
    const res = await pgliteAdapter.query<{
      id: string; quiz_id: string; score: number; total: number;
      answers: string; started_at: number; finished_at: number;
    }>(
      `SELECT * FROM quiz_attempts WHERE quiz_id = $1 ORDER BY started_at DESC`,
      [quizId]
    );
    return res.rows.map((r) => ({
      id: r.id, quizId: r.quiz_id, score: r.score, total: r.total,
      answers: JSON.parse(r.answers) as Record<string, string>,
      startedAt: r.started_at, finishedAt: r.finished_at ?? undefined,
    }));
  },
};
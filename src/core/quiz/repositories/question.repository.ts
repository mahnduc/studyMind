// core/quiz/repositories/question.repository.ts


import { pgliteAdapter } from "@/core/storage/pglite.adapter";
import { Question } from "../types";

export const questionRepository = {
  async getByQuizId(quizId: string): Promise<Question[]> {
    const res = await pgliteAdapter.query<{
      id: string; content: string; options: string;
      correct_id: string; explanation: string; difficulty: string;
    }>(
      `SELECT id, content, options, correct_id, explanation, difficulty
       FROM questions WHERE quiz_id = $1 ORDER BY question_index`,
      [quizId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      content: r.content,
      options: JSON.parse(r.options) as Question["options"],
      correctId: r.correct_id,
      explanation: r.explanation ?? undefined,
      difficulty: r.difficulty as Question["difficulty"],
    }));
  },

  async countByQuizId(quizId: string): Promise<number> {
    const res = await pgliteAdapter.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM questions WHERE quiz_id = $1`,
      [quizId]
    );
    return Number(res.rows[0]?.count ?? 0);
  },
};
// core/quiz/repositories/quiz.repository.ts
// MÔ TẢ: Domain repository facade cho quiz (dùng storage layer)

import { quizStorageRepository } from "@/core/storage/repositories/quiz.repository";
import { Quiz, Question, QuizAttempt } from "../types";

function generateId(): string {
  return `quiz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const quizRepository = {
  async save(input: {
    title: string;
    questions: unknown[];
    sourceDocumentId?: string;
    createdAt?: number;
  }): Promise<string> {
    return quizStorageRepository.save({
      id: generateId(),
      title: input.title,
      questions: input.questions as Question[],
      sourceDocumentId: input.sourceDocumentId,
      createdAt: input.createdAt ?? Date.now(),
    });
  },

  async getById(id: string): Promise<Quiz | null> {
    return quizStorageRepository.getById(id);
  },

  async list(): Promise<Omit<Quiz, "questions">[]> {
    return quizStorageRepository.list();
  },

  async delete(id: string): Promise<void> {
    return quizStorageRepository.delete(id);
  },

  async saveAttempt(attempt: Omit<QuizAttempt, "id">): Promise<string> {
    return quizStorageRepository.saveAttempt(attempt);
  },

  async getAttempts(quizId: string): Promise<QuizAttempt[]> {
    return quizStorageRepository.getAttemptsByQuizId(quizId);
  },
};
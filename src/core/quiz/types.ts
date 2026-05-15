// core/quiz/types.ts

export interface QuizOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  content: string;
  options: QuizOption[];
  correctId: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface Quiz {
  id: string;
  title: string;
  sourceDocumentId?: string;
  createdAt: number;
  questions: Question[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  score: number;
  total: number;
  answers: Record<string, string>; // questionId → selectedOptionId
  startedAt: number;
  finishedAt?: number;
}

export interface GenerateQuizInput {
  content: string;
  questionCount: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  topic?: string;
}
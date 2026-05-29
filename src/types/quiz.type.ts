export interface MCQQuestion {
  question: string;
  options: { [key: string]: string };
  answer: string;
  chunkId: string;
}

export interface QuizFileContent {
  knowledgeBase: string;
  createdAt: string;
  totalQuestions: number;
  questions: MCQQuestion[];
}

export interface QuizCardData {
  id: string;
  fileName: string;
  knowledgeBase: string;
  createdAt: string;
  totalQuestions: number;
  rawContent: QuizFileContent;
}

export interface QuizHistoryAttempt {
  attemptId: string;
  timestamp: string;
  score: number;
  totalQuestions: number;
  duration: number;
  accuracy: number;
}

export interface QuizHistoryFile {
  quizFileName: string;
  attempts: QuizHistoryAttempt[];
}
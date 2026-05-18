// types.ts
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

// Cấu trúc một lượt làm bài để lưu trữ vào Lịch sử
export interface QuizHistoryAttempt {
  attemptId: string;
  timestamp: string;      // Ngày giờ nộp bài
  score: number;          // Số câu đúng
  totalQuestions: number; // Tổng số câu
  duration: number;       // Thời gian làm bài (tính bằng giây)
  accuracy: number;       // Tỷ lệ chính xác (%)
}

// Cấu trúc file lịch sử lưu trong OPFS (Mỗi bộ đề có 1 file lịch sử riêng)
export interface QuizHistoryFile {
  quizFileName: string;
  attempts: QuizHistoryAttempt[];
}
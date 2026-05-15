"use client";
// core/features/quiz/hooks/useQuiz.ts
// MÔ TẢ: Hook quản lý state cho quiz listing và quiz player

import { useState, useEffect, useCallback } from "react";
import { quizRepository } from "../../../quiz/repositories/quiz.repository";
import { Quiz, QuizAttempt, Question } from "../../../quiz/types";

// ── useQuizList: danh sách quiz ───────────────────────────────

export interface UseQuizListReturn {
  quizzes: Omit<Quiz, "questions">[];
  isLoading: boolean;
  error: string | null;
  deleteQuiz: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useQuizList(): UseQuizListReturn {
  const [quizzes, setQuizzes] = useState<Omit<Quiz, "questions">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await quizRepository.list();
      setQuizzes(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách quiz");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const deleteQuiz = useCallback(async (id: string) => {
    try {
      await quizRepository.delete(id);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa quiz thất bại");
    }
  }, []);

  return { quizzes, isLoading, error, deleteQuiz, refresh };
}

// ── useQuizPlayer: chơi quiz ──────────────────────────────────

export type PlayerPhase = "loading" | "playing" | "review" | "done";

export interface UseQuizPlayerReturn {
  quiz: Quiz | null;
  phase: PlayerPhase;
  currentIndex: number;
  currentQuestion: Question | null;
  selectedAnswer: string | null;
  answers: Record<string, string>;
  score: number;
  isLastQuestion: boolean;
  isCorrect: boolean | null;
  attempts: QuizAttempt[];
  error: string | null;
  selectAnswer: (optionId: string) => void;
  confirmAnswer: () => void;
  nextQuestion: () => void;
  finish: () => Promise<void>;
  restart: () => void;
}

export function useQuizPlayer(quizId: string): UseQuizPlayerReturn {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [phase, setPhase] = useState<PlayerPhase>("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [startedAt] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [loadedQuiz, loadedAttempts] = await Promise.all([
          quizRepository.getById(quizId),
          quizRepository.getAttempts(quizId),
        ]);
        if (!loadedQuiz) { setError("Không tìm thấy quiz"); return; }
        setQuiz(loadedQuiz);
        setAttempts(loadedAttempts);
        setPhase("playing");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải quiz");
      }
    })();
  }, [quizId]);

  const currentQuestion = quiz?.questions[currentIndex] ?? null;
  const isLastQuestion = quiz ? currentIndex === quiz.questions.length - 1 : false;
  const isCorrect = confirmed && currentQuestion
    ? answers[currentQuestion.id] === currentQuestion.correctId
    : null;

  const score = quiz
    ? quiz.questions.filter((q) => answers[q.id] === q.correctId).length
    : 0;

  const selectAnswer = useCallback((optionId: string) => {
    if (confirmed) return;
    setSelectedAnswer(optionId);
  }, [confirmed]);

  const confirmAnswer = useCallback(() => {
    if (!selectedAnswer || !currentQuestion || confirmed) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: selectedAnswer }));
    setConfirmed(true);
  }, [selectedAnswer, currentQuestion, confirmed]);

  const nextQuestion = useCallback(() => {
    if (!quiz) return;
    setSelectedAnswer(null);
    setConfirmed(false);
    if (isLastQuestion) {
      setPhase("review");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [quiz, isLastQuestion]);

  const finish = useCallback(async () => {
    if (!quiz) return;
    try {
      const finalScore = quiz.questions.filter(
        (q) => answers[q.id] === q.correctId
      ).length;
      const attemptId = await quizRepository.saveAttempt({
        quizId: quiz.id,
        score: finalScore,
        total: quiz.questions.length,
        answers,
        startedAt,
        finishedAt: Date.now(),
      });
      const newAttempt: QuizAttempt = {
        id: attemptId,
        quizId: quiz.id,
        score: finalScore,
        total: quiz.questions.length,
        answers,
        startedAt,
        finishedAt: Date.now(),
      };
      setAttempts((prev) => [newAttempt, ...prev]);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi lưu kết quả");
    }
  }, [quiz, answers, startedAt]);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    setSelectedAnswer(null);
    setConfirmed(false);
    setPhase("playing");
  }, []);

  return {
    quiz,
    phase,
    currentIndex,
    currentQuestion,
    selectedAnswer,
    answers,
    score,
    isLastQuestion,
    isCorrect,
    attempts,
    error,
    selectAnswer,
    confirmAnswer,
    nextQuestion,
    finish,
    restart,
  };
}
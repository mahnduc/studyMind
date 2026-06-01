"use client";

import { useState, useCallback } from "react";
import { getSavedQuizFromOPFS, SavedQuizData } from "@/lib/rag/qa-generator";

export function useQuiz() {
  const [quizData, setQuizData] = useState<SavedQuizData | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);

  // Hàm load bộ đề được gọi tường minh từ Orchestrator hoặc UI
  const loadQuizFromOPFS = useCallback(async (cleanFolderName: string) => {
    if (!cleanFolderName) {
      setQuizData(null);
      return;
    }

    setIsLoadingQuiz(true);
    try {
      const data = await getSavedQuizFromOPFS(cleanFolderName);
      setQuizData(data);
    } catch (err) {
      console.error("Không thể đọc bộ đề từ OPFS:", err);
      setQuizData(null);
    } finally {
      setIsLoadingQuiz(false);
    }
  }, []);

  const handleToggleToolbar = () => {
    setShowToolbar((prev) => !prev);
  };

  const handleStartQuiz = () => {
    if (quizData) {
      setIsPracticing(true);
    }
  };

  const handleStopQuiz = () => {
    setIsPracticing(false);
  };

  return {
    quizData,
    setQuizData,
    isLoadingQuiz,
    showToolbar,
    setShowToolbar,
    isPracticing,
    setIsPracticing,
    loadQuizFromOPFS,
    handleToggleToolbar,
    handleStartQuiz,
    handleStopQuiz,
  };
}
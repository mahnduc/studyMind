"use client";

import { useState, useEffect } from "react";
import { getSavedQuizFromOPFS, SavedQuizData } from "@/lib/rag/qa-generator";

interface UseQuizProps {
  selectedFile: string | null;
  cleanFolderName: string;
  isGeneratingQuiz: boolean;
  isIngesting: boolean;
  handleConfirmIngestion: () => Promise<boolean>;
}

export function useQuiz({
  selectedFile,
  cleanFolderName,
  isGeneratingQuiz,
  isIngesting,
  handleConfirmIngestion,
}: UseQuizProps) {
  const [quizData, setQuizData] = useState<SavedQuizData | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);

  // Side-effect: Tự động load bộ đề từ OPFS khi đổi file hoặc tạo xong quiz
  useEffect(() => {
    async function loadQuiz() {
      if (!selectedFile) {
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
    }

    if (!isGeneratingQuiz) {
      loadQuiz();
    }
  }, [selectedFile, isGeneratingQuiz, cleanFolderName]);

  // Side-effect: Reset trạng thái giao diện khi người dùng đổi file tài liệu khác
  useEffect(() => {
    setShowToolbar(false);
    setIsPracticing(false);
  }, [selectedFile]);

  // Xử lý bật/tắt thanh công cụ tạo đề và tự động ingest dữ liệu nếu cần
  const handleToggleToolbar = async () => {
    const nextState = !showToolbar;
    setShowToolbar(nextState);

    if (nextState && selectedFile && !isIngesting) {
      try {
        await handleConfirmIngestion();
      } catch (err) {
        console.error("Lỗi nạp dữ liệu chunk gốc:", err);
      }
    }
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
    isLoadingQuiz,
    showToolbar,
    isPracticing,
    handleToggleToolbar,
    handleStartQuiz,
    handleStopQuiz,
  };
}
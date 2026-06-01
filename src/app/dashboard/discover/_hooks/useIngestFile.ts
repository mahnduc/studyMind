"use client";

import { useState } from "react";
import { ingestFromPath } from "@/lib/rag/api";
import { generateMCQBankFromOPFS, MCQQuestion } from "@/lib/rag/qa-generator";

export function useIngestFile(directoryName: string = "system-raw-file") {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [requestedQuestions, setRequestedQuestions] = useState<number>(10);
  const [generatedQuiz, setGeneratedQuiz] = useState<MCQQuestion[]>([]);

  const handleSelectFile = (fileName: string) => {
    if (isIngesting || isGeneratingQuiz) return;
    setSelectedFile((prev) => (prev === fileName ? null : fileName));
    setGeneratedQuiz([]);
  };

  const handleConfirmIngestion = async (): Promise<boolean> => {
    if (!selectedFile) return false;

    setIsIngesting(true);
    try {
      const filePath = `${directoryName}/${selectedFile}`;
      const response = await ingestFromPath(filePath);

      if (response.success) {
        return true;
      } else {
        alert("Lỗi Ingest: " + response.error);
        return false;
      }
    } catch (error: any) {
      alert("Lỗi Ingest: " + (error?.message || "Không thể xử lý dữ liệu."));
      return false;
    } finally {
      setIsIngesting(false);
    }
  };

  const handleCreateQuiz = async (customCount?: number, folderName?: string) => {
    const countToGenerate = customCount !== undefined ? customCount : requestedQuestions;
    const finalCount = Math.min(Math.max(countToGenerate, 1), 20);
    const targetFolder = folderName || selectedFile?.split('.').slice(0, -1).join('.') || "default_kb";

    setIsGeneratingQuiz(true);
    try {
      const quizResult = await generateMCQBankFromOPFS(targetFolder, finalCount);
      setGeneratedQuiz(quizResult);
      return quizResult;
    } catch (error: any) {
      alert("Lỗi tạo Quiz: " + (error?.message || "Không thể sinh câu hỏi trắc nghiệm."));
      return null;
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return {
    selectedFile,
    setSelectedFile,
    isIngesting,
    isGeneratingQuiz,
    requestedQuestions,
    setRequestedQuestions,
    generatedQuiz,
    setGeneratedQuiz,
    handleSelectFile,
    handleConfirmIngestion,
    handleCreateQuiz,
  };
}
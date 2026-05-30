"use client";

import React from "react";
import { useOPFSFiles } from "./useOPFSFiles";
import { useUploadToOPFS } from "./useUploadToOPFS";
import { useIngestFile } from "./useIngestFile";
import { useQuiz } from "./useQuiz";

export function useAssistant() {
  const DIR_NAME = "system-raw-file";

  const { files, loading, refreshFiles, deleteFile } = useOPFSFiles(DIR_NAME);

  const { 
    selectedFile, 
    setSelectedFile, 
    isIngesting, 
    handleSelectFile, 
    handleConfirmIngestion,
    isGeneratingQuiz,
    requestedQuestions,
    setRequestedQuestions,
    handleCreateQuiz,
  } = useIngestFile(DIR_NAME);

  const { fileInputRef, triggerFileInput, handleFileUpload } = useUploadToOPFS({
    directoryName: DIR_NAME,
    onUploadSuccess: refreshFiles,
  });

  const handleDeleteFile = async (name: string, e: React.MouseEvent) => {
    await deleteFile(name, e, () => {
      if (selectedFile === name) setSelectedFile(null);
    });
  };

  // Tính toán tên folder sạch từ file được chọn
  const cleanFolderName = selectedFile ? selectedFile.replace(/\.[^/.]+$/, "") : "";

  const quiz = useQuiz({
    selectedFile,
    cleanFolderName,
    isGeneratingQuiz,
    isIngesting,
    handleConfirmIngestion,
  });

  // Gom các biến cờ trạng thái xử lý logic chung
  const isPending = isIngesting || isGeneratingQuiz;
  const isActionDisabled = !selectedFile || isPending;

  return {
    // File & Upload state
    files,
    loading,
    selectedFile,
    fileInputRef,
    triggerFileInput,
    handleFileUpload,
    handleSelectFile,
    deleteFile: handleDeleteFile,
    cleanFolderName,

    // Ingest & Generator state
    isIngesting,
    isGeneratingQuiz,
    requestedQuestions,
    setRequestedQuestions,
    handleCreateQuiz,
    isPending,
    isActionDisabled,

    // Quiz state (Kết quả từ hook useQuiz)
    quizData: quiz.quizData,
    isLoadingQuiz: quiz.isLoadingQuiz,
    showToolbar: quiz.showToolbar,
    isPracticing: quiz.isPracticing,
    handleToggleToolbar: quiz.handleToggleToolbar,
    handleStartQuiz: quiz.handleStartQuiz,
    handleStopQuiz: quiz.handleStopQuiz,
  };
}
"use client";

import React, { useEffect, useRef } from "react";
import { useOPFSFiles } from "./useOPFSFiles";
import { useUploadToOPFS } from "./useUploadToOPFS";
import { useIngestFile } from "./useIngestFile";
import { useQuiz } from "./useQuiz";

export function useAssistant() {
  const DIR_NAME = "system-raw-file";

  // 1. Khởi tạo các hook nghiệp vụ độc lập
  const { files, loading, refreshFiles, deleteFile } = useOPFSFiles(DIR_NAME);
  const { 
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
    handleStopQuiz 
  } = useQuiz();
  
  const ingestFileContext = useIngestFile(DIR_NAME);
  const { selectedFile, setSelectedFile, isIngesting, isGeneratingQuiz, handleSelectFile, handleConfirmIngestion } = ingestFileContext;

  const { fileInputRef, triggerFileInput, handleFileUpload } = useUploadToOPFS({
    directoryName: DIR_NAME,
    onUploadSuccess: refreshFiles,
  });

  // Lưu trữ file đã xử lý gần nhất để tránh loop do thay đổi reference của hàm
  const lastIngestedFileRef = useRef<string | null>(null);

  // 2. Các phần tính toán giá trị phái sinh (Computed properties)
  const cleanFolderName = selectedFile ? selectedFile.replace(/\.[^/.]+$/, "") : "";
  const isPending = isIngesting || isGeneratingQuiz;
  const isActionDisabled = !selectedFile || isPending;

  // 3. Centralized Side-effects (Điều phối luồng dữ liệu liên hook)
  
  // TỰ ĐỘNG INGEST KHI CHỌN FILE (Chống loop triệt để)
  useEffect(() => {
    // Nếu không có file, hoặc file này vừa mới được nạp/đang nạp thì bỏ qua
    if (!selectedFile || isIngesting || lastIngestedFileRef.current === selectedFile) {
      if (!selectedFile) lastIngestedFileRef.current = null;
      return;
    }

    const autoIngest = async () => {
      lastIngestedFileRef.current = selectedFile;
      try {
        await handleConfirmIngestion();
      } catch (err) {
        console.error("Lỗi tự động nạp cấu trúc tri thức:", err);
        // Nếu lỗi, reset ref để người dùng có thể click thử lại
        lastIngestedFileRef.current = null; 
      }
    };

    autoIngest();
  }, [selectedFile, isIngesting, handleConfirmIngestion]);

  // Effect: Khi thay đổi selectedFile hoặc sinh xong Quiz -> Tải dữ liệu bài tập
  useEffect(() => {
    if (!selectedFile) {
      setQuizData(null);
      return;
    }
    if (!isGeneratingQuiz) {
      loadQuizFromOPFS(cleanFolderName);
    }
  }, [selectedFile, isGeneratingQuiz, cleanFolderName, loadQuizFromOPFS, setQuizData]);

  // Effect: Khi thay đổi selectedFile -> Reset trạng thái hiển thị của UI Quiz
  useEffect(() => {
    setShowToolbar(false);
    setIsPracticing(false);
  }, [selectedFile, setShowToolbar, setIsPracticing]);

  // 4. Các hàm phối hợp logic
  const handleDeleteFile = async (name: string, e: React.MouseEvent) => {
    await deleteFile(name, e, () => {
      if (selectedFile === name) {
        setSelectedFile(null);
        lastIngestedFileRef.current = null;
      }
    });
  };

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
    requestedQuestions: ingestFileContext.requestedQuestions,
    setRequestedQuestions: ingestFileContext.setRequestedQuestions,
    handleCreateQuiz: ingestFileContext.handleCreateQuiz,
    isPending,
    isActionDisabled,

    // Quiz state
    quizData,
    isLoadingQuiz,
    showToolbar,
    isPracticing,
    handleToggleToolbar, // Trả về hàm gốc thuần túy, không bọc lồng ingest ở đây nữa
    handleStartQuiz,
    handleStopQuiz,
  };
}
"use client";

import React from "react";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { useAssistant } from "./_hooks/useAssistant";
import { CourseActionCards } from "./_components/CourseActionCards";
import { FileList } from "./_components/FileList";
import { QuizSummaryCard } from "./_components/QuizSummaryCard";
import { QuizToolbar } from "./_components/QuizToolbar";
import QuizPracticeScreen from "@/components/quiz/QuizPracticeScreen";
import Link from "next/link";
import Lookup from "./_components/Lookup";

export default function AssistantPage() {
  const {
    files,
    loading,
    isIngesting,
    selectedFile,
    fileInputRef,
    triggerFileInput,
    handleFileUpload,
    handleSelectFile,
    deleteFile,
    isGeneratingQuiz,
    requestedQuestions,
    setRequestedQuestions,
    handleCreateQuiz,
    cleanFolderName,
    isPending,
    isActionDisabled,
    quizData,
    isLoadingQuiz,
    showToolbar,
    isPracticing,
    handleToggleToolbar,
    handleStartQuiz,
    handleStopQuiz,
  } = useAssistant();

  if (isPracticing && quizData) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] p-6 lg:p-10">
        <QuizPracticeScreen
          quizData={quizData} 
          onBack={handleStopQuiz}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] font-sans text-gray-700 antialiased">
      <main className="p-6 lg:p-10 w-full">
        <div className="w-full max-w-6xl mx-auto pb-20 flex flex-col gap-8">
          
          <div className="w-full">
            <CourseActionCards 
              fileInputRef={fileInputRef}
              triggerFileInput={triggerFileInput}
              handleFileUpload={handleFileUpload}
            />
          </div>

          <div className="w-full flex flex-col gap-6">
            {/* Danh sách File tài liệu */}
            <FileList 
              files={files}
              loading={loading}
              selectedFile={selectedFile}
              isIngesting={isIngesting}
              isPending={isPending}
              handleSelectFile={handleSelectFile}
              deleteFile={deleteFile}
            />

            {/* Khu vực tóm tắt / tạo trắc nghiệm */}
            {selectedFile && (
              <div className="w-full transition-all duration-500 animate-fade-in flex flex-col gap-4">
                {isLoadingQuiz ? (
                  <div className="w-full bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[120px] gap-2">
                    <Loader2 className="animate-spin text-indigo-500" size={24} />
                    <p className="font-medium text-gray-400 text-xs">Đang kiểm tra bộ đề dữ liệu cục bộ...</p>
                  </div>
                ) : (
                  <>
                    <QuizSummaryCard 
                      quizData={quizData}
                      selectedFile={selectedFile}
                      showToolbar={showToolbar}
                      handleToggleToolbar={handleToggleToolbar}
                      handleStartQuiz={handleStartQuiz}
                    />

                    {showToolbar && (
                      <QuizToolbar 
                        isActionDisabled={isActionDisabled}
                        requestedQuestions={requestedQuestions}
                        setRequestedQuestions={setRequestedQuestions}
                        onTriggerCreateQuiz={async () => {
                          await handleCreateQuiz(requestedQuestions, cleanFolderName);
                        }}
                        isPending={isPending}
                        isGeneratingQuiz={isGeneratingQuiz}
                        isIngesting={isIngesting}
                      />
                    )}

                    <Lookup />
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
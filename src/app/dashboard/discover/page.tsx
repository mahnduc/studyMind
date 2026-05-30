"use client";

import React, { useState } from "react";
import { ArrowRight, Loader2, Maximize2, Search } from "lucide-react";
import { useAssistant } from "./_hooks/useDiscoverState";
import { CourseActionCards } from "./_components/CourseActionCards";
import { FileList } from "./_components/FileList";
import { QuizSummaryCard } from "./_components/QuizSummaryCard";
import { QuizToolbar } from "./_components/QuizToolbar";
import QuizPracticeScreen from "@/components/quiz/QuizPracticeScreen";
import { FileViewer } from "./_components/FileViewer";

export default function DiscoverPage() {
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

  const [isViewingFileIsland, setIsViewingFileIsland] = useState(false);

  React.useEffect(() => {
    setIsViewingFileIsland(false);
  }, [selectedFile]);

  if (isPracticing && quizData) {
    return (
      <div className="w-full h-full p-6 lg:p-10 overflow-y-auto">
        <QuizPracticeScreen
          quizData={quizData} 
          onBack={handleStopQuiz}
        />
      </div>
    );
  }

  if (isViewingFileIsland && selectedFile) {
    return (
      <div className="w-full h-screen bg-[#F8FAFC] animate-fade-in overflow-hidden">
        <div className="w-full h-full">
          <FileViewer
            fileName={selectedFile}
            onClose={() => setIsViewingFileIsland(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#F8FAFC] font-sans text-gray-700 antialiased flex flex-col">
      <div className="p-6 lg:p-10 w-full flex-1 overflow-y-auto">
        <div className="w-full max-w-6xl mx-auto pb-10 flex flex-col gap-8">
          
          <div className="w-full">
            <CourseActionCards 
              fileInputRef={fileInputRef}
              triggerFileInput={triggerFileInput}
              handleFileUpload={handleFileUpload}
            />
          </div>

          <div className="w-full flex flex-col gap-6">
            <FileList 
              files={files}
              loading={loading}
              selectedFile={selectedFile}
              isIngesting={isIngesting}
              isPending={isPending}
              handleSelectFile={handleSelectFile}
              deleteFile={deleteFile}
            />

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

                    <div 
                      onClick={() => setIsViewingFileIsland(true)}
                      className="w-full bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="bg-linear-to-br from-indigo-500 to-violet-500 text-white p-4 rounded-2xl shadow-sm shrink-0 flex items-center justify-center">
                          <Maximize2 size={26} />
                        </div>
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md">
                              Chế độ tập trung
                            </span>
                            <span className="text-gray-300 text-xs">•</span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md">
                              <Search size={10} /> Tra cứu thông minh
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-800 text-lg">Chi tiết tài liệu</h3>
                          <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            Mở không gian đọc file <span className="font-semibold text-indigo-600">"{selectedFile}"</span> riêng tư, hỗ trợ tìm và truy vấn thông tin nhanh chóng.
                          </p>
                        </div>
                      </div>

                      <div className="self-end md:self-center shrink-0 bg-gray-50 text-gray-400 p-3 rounded-full">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
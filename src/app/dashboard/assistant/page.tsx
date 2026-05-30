"use client";

import React, { useState } from "react";
import { ArrowLeft, Loader2, Maximize2 } from "lucide-react";
import { useAssistant } from "./_hooks/useAssistant";
import { CourseActionCards } from "./_components/CourseActionCards";
import { FileList } from "./_components/FileList";
import { QuizSummaryCard } from "./_components/QuizSummaryCard";
import { QuizToolbar } from "./_components/QuizToolbar";
import QuizPracticeScreen from "@/components/quiz/QuizPracticeScreen";
import Lookup from "./_components/Lookup";
import { FileViewer } from "./_components/FileViewer";

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
          
          {/* Khu vực Upload / Thao tác khóa học */}
          <div className="w-full">
            <CourseActionCards 
              fileInputRef={fileInputRef}
              triggerFileInput={triggerFileInput}
              handleFileUpload={handleFileUpload}
            />
          </div>

          <div className="w-full flex flex-col gap-6">
            {/* Danh sách các file tài liệu hiện có */}
            <FileList 
              files={files}
              loading={loading}
              selectedFile={selectedFile}
              isIngesting={isIngesting}
              isPending={isPending}
              handleSelectFile={handleSelectFile}
              deleteFile={deleteFile}
            />

            {/* Khu vực tương tác bổ trợ khi chọn File */}
            {selectedFile && (
              <div className="w-full transition-all duration-500 animate-fade-in flex flex-col gap-4">
                {isLoadingQuiz ? (
                  <div className="w-full bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[120px] gap-2">
                    <Loader2 className="animate-spin text-indigo-500" size={24} />
                    <p className="font-medium text-gray-400 text-xs">Đang kiểm tra bộ đề dữ liệu cục bộ...</p>
                  </div>
                ) : (
                  <>
                    {/* Tóm tắt nội dung bài học */}
                    <QuizSummaryCard 
                      quizData={quizData}
                      selectedFile={selectedFile}
                      showToolbar={showToolbar}
                      handleToggleToolbar={handleToggleToolbar}
                      handleStartQuiz={handleStartQuiz}
                    />

                    {/* Thanh cấu hình số lượng câu hỏi Quiz */}
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

                    <div 
                      onClick={() => setIsViewingFileIsland(true)}
                      className="w-full bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 cursor-pointer"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="bg-linear-to-br from-indigo-500 to-violet-500 text-white p-4 rounded-2xl shadow-md shrink-0">
                          <Maximize2 size={26} />
                        </div>
                        
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md">
                            Chế độ tập trung
                          </span>
                          
                          <h3 className="font-bold text-gray-800 text-lg">
                            Xem chi tiết nội dung tài liệu
                          </h3>
                          
                          <p className="text-xs text-gray-400 font-medium leading-relaxed">
                            Bấm vào để mở không gian đọc file <span className="font-semibold text-gray-500">"{selectedFile}"</span> ở chế độ riêng tư, không xao nhãng.
                          </p>
                        </div>
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
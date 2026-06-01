"use client";

import React from "react";
import { HelpCircle, List, Calendar, Settings2, ArrowRight } from "lucide-react";
import { SavedQuizData } from "@/lib/rag/qa-generator";

interface QuizSummaryCardProps {
  quizData: SavedQuizData | null;
  selectedFile: string | null;
  showToolbar: boolean;
  handleToggleToolbar: () => void;
  handleStartQuiz: () => void;
}

export function QuizSummaryCard({
  quizData,
  selectedFile, // Đã map đúng property nhận từ Page vào component
  showToolbar,
  handleToggleToolbar,
  handleStartQuiz,
}: QuizSummaryCardProps) {

  if (!quizData) {
    return (
      <div className="w-full bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left animate-fade-in">
        <div className="space-y-1">
          <p className="font-semibold text-gray-700 text-sm">
            Tài liệu <span className="text-indigo-600">"{selectedFile}"</span> chưa có bộ câu hỏi
          </p>
          <p className="text-xs text-gray-400">Hệ thống đã nạp tri thức cục bộ thành công. Bạn có thể mở công cụ cấu hình để khởi tạo bài tập trắc nghiệm AI mới.</p>
        </div>
        <button
          onClick={handleToggleToolbar}
          className={`px-5 py-3 font-bold text-xs rounded-xl transition-all flex items-center gap-2 mx-auto md:mx-0 shadow-xs
            ${showToolbar 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}
        >
          <Settings2 size={16} />
          {showToolbar ? "Đóng cài đặt" : "Tạo trắc nghiệm"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-indigo-100 transition-all duration-300 group animate-fade-in">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="bg-linear-to-br from-emerald-500 to-teal-500 text-white p-4 rounded-2xl shadow-md shrink-0">
          <HelpCircle size={26} />
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md">
            Sinh trắc nghiệm
          </span>
          <h3 className="font-bold text-gray-800 text-lg truncate pr-4">
            Bộ câu hỏi: {quizData.knowledgeBase}
          </h3>
          <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1">
              <List size={14} /> <strong className="text-gray-600 font-semibold">{quizData.totalQuestions}</strong> câu hỏi trắc nghiệm
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} /> {new Date(quizData.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
        <button
          onClick={handleToggleToolbar}
          className={`p-3.5 border rounded-2xl transition-all flex items-center justify-center gap-2 text-sm font-semibold
            ${showToolbar 
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
          title="Cấu hình tạo lại bộ đề"
        >
          <Settings2 size={18} />
        </button>

        <button
          onClick={handleStartQuiz}
          className="flex-1 sm:flex-none px-6 py-3.5 bg-gray-900 hover:bg-indigo-600 text-white font-bold text-sm rounded-2xl shadow-sm hover:shadow-lg hover:shadow-indigo-600/10 transition-all duration-300 flex items-center justify-center gap-2 group/btn"
        >
          <span>Luyện tập ngay</span>
          <ArrowRight size={16} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
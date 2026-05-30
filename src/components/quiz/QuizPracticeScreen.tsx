"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Clock, Award, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { SavedQuizData } from "@/lib/rag/qa-generator";
import { QuizHistoryAttempt, QuizHistoryFile } from "@/types/quiz.type";

interface QuizPracticeScreenProps {
  quizData: SavedQuizData;
  onBack: () => void;
}

// Hàm hỗ trợ ghi nhận kết quả bài làm vào OPFS thư mục history_quiz
async function saveAttemptToOPFS(knowledgeBase: string, attempt: QuizHistoryAttempt) {
  try {
    const root = await navigator.storage.getDirectory();
    const historyDir = await root.getDirectoryHandle("history_quiz", { create: true });
    const fileName = `${knowledgeBase}_history.json`;
    
    let historyData: QuizHistoryFile = {
      quizFileName: `${knowledgeBase}.json`,
      attempts: []
    };

    try {
      const fileHandle = await historyDir.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const text = await file.text();
      if (text) historyData = JSON.parse(text);
    } catch (e) {
      // Bỏ qua lỗi nếu file chưa tồn tại lần nào
    }

    historyData.attempts.unshift(attempt);

    const fileHandle = await historyDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(historyData, null, 2));
    await writable.close();
    console.log("[OPFS] Ghi lịch sử thành công:", fileName);
  } catch (err) {
    console.error("[OPFS] Thất bại khi ghi lịch sử bài làm:", err);
  }
}

export default function QuizPracticeScreen({ quizData, onBack }: QuizPracticeScreenProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentQuestion = quizData.questions[currentIdx];

  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = answeredCount === quizData.totalQuestions;

  useEffect(() => {
    if (!isSubmitted) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (key: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: key }));
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitted || !isAllAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    let correctCount = 0;
    quizData.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) correctCount++;
    });

    const accuracy = Math.round((correctCount / quizData.totalQuestions) * 100);
    setIsSubmitted(true);

    const attemptResult: QuizHistoryAttempt = {
      attemptId: `att_${Date.now()}`,
      timestamp: new Date().toISOString(),
      score: correctCount,
      totalQuestions: quizData.totalQuestions,
      duration,
      accuracy,
    };

    await saveAttemptToOPFS(quizData.knowledgeBase, attemptResult);
  };

  const handleResetQuiz = () => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setDuration(0);
  };

  const totalCorrect = quizData.questions.filter((q, idx) => selectedAnswers[idx] === q.answer).length;

  return (
    <div className="w-full max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between bg-white px-6 py-4 border border-gray-100 rounded-3xl shadow-sm">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-all uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> Thoát luyện tập
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 text-amber-700 font-mono text-xs font-bold rounded-xl shadow-sm">
          <Clock size={14} className={!isSubmitted ? "animate-pulse" : ""} />
          {formatTime(duration)}
        </div>
      </div>

      {isSubmitted && (
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 rounded-2xl text-yellow-400 shrink-0">
              <Award size={36} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-wide">Hoàn Thành Bài Tập!</h3>
              <p className="text-xs text-indigo-200/70">Dữ liệu kết quả đã được lưu trữ vào tệp cấu trúc hệ thống OPFS cục bộ.</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase text-indigo-200">Đúng</p>
              <p className="text-xl font-black text-emerald-400">{totalCorrect}/{quizData.totalQuestions}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-[10px] font-bold uppercase text-indigo-200">Chính xác</p>
              <p className="text-xl font-black text-cyan-400">{Math.round((totalCorrect / quizData.totalQuestions) * 100)}%</p>
            </div>
            <button 
              onClick={handleResetQuiz}
              className="ml-2 px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md"
            >
              <RotateCcw size={14} /> Làm lại
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md">
              Câu hỏi {currentIdx + 1} / {quizData.totalQuestions}
            </span>
            <h3 className="font-bold text-gray-800 text-base leading-relaxed">{currentQuestion?.question}</h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {Object.entries(currentQuestion?.options || {}).map(([key, value]) => {
              const isSelected = selectedAnswers[currentIdx] === key;
              const isCorrectAnswer = currentQuestion.answer === key;

              let optionStyle = "border-gray-200 hover:bg-gray-50 text-gray-700";
              if (!isSubmitted && isSelected) {
                optionStyle = "border-indigo-600 bg-indigo-50/60 text-indigo-900 font-medium";
              } else if (isSubmitted) {
                if (isCorrectAnswer) optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                else if (isSelected && !isCorrectAnswer) optionStyle = "border-rose-400 bg-rose-50 text-rose-900";
                else optionStyle = "border-gray-100 opacity-50 text-gray-400";
              }

              return (
                <button
                  key={key}
                  disabled={isSubmitted}
                  onClick={() => handleSelectOption(key)}
                  className={`w-full text-left px-5 py-3.5 border-2 rounded-2xl flex items-start gap-3 transition-all duration-200 ${optionStyle}`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                    isSelected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"
                  } ${isSubmitted && isCorrectAnswer ? "bg-emerald-500 text-white" : ""}`}>
                    {key}
                  </span>
                  <span className="text-sm leading-snug pt-0.5">{value}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((prev) => prev - 1)}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 disabled:opacity-30 flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Câu trước
            </button>
            <button
              disabled={currentIdx === quizData.questions.length - 1}
              onClick={() => setCurrentIdx((prev) => prev + 1)}
              className="px-4 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-30 flex items-center gap-1"
            >
              Câu kế tiếp <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-4">Danh sách câu hỏi</h4>
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
              {quizData.questions.map((q, idx) => {
                const isAnswered = selectedAnswers[idx] !== undefined;
                const isCurrent = currentIdx === idx;
                
                let gridStyle = "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-400";
                if (isAnswered) gridStyle = "bg-indigo-50 border-indigo-200 text-indigo-600";
                if (isCurrent) gridStyle = "border-indigo-600 bg-indigo-600 text-white font-bold ring-2 ring-indigo-100";
                
                if (isSubmitted) {
                  gridStyle = selectedAnswers[idx] === q.answer 
                    ? "bg-emerald-50 border-emerald-300 text-emerald-600 font-bold"
                    : "bg-rose-50 border-rose-200 text-rose-500";
                  if (isCurrent) gridStyle += " ring-2 ring-offset-1 ring-indigo-500";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 border rounded-xl text-xs font-mono transition-all flex items-center justify-center ${gridStyle}`}
                  >
                    {(idx + 1).toString().padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {!isSubmitted ? (
              <>
                {!isAllAnswered && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium leading-normal">
                      Bạn cần hoàn thành tất cả câu hỏi để nộp bài.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSubmitQuiz}
                  disabled={!isAllAnswered}
                  className="w-full py-3.5 bg-gray-900 hover:bg-emerald-600 disabled:bg-gray-100 text-white disabled:text-gray-400 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={16} /> Nộp bài kiểm tra
                </button>
              </>
            ) : (
              <button
                onClick={onBack}
                className="w-full py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center"
              >
                Kết thúc & Quay về
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
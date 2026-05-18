'use client';

import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { QuizCardData, QuizHistoryFile, QuizHistoryAttempt } from '../types';

interface QuizActiveSessionProps {
  activeQuiz: QuizCardData;
  onExit: () => void;
}

export default function QuizActiveSession({ activeQuiz, onExit }: QuizActiveSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [quizStartTime] = useState<number>(Date.now());

  const currentQuestion = activeQuiz.rawContent.questions[currentQuestionIndex];
  const totalQuestions = activeQuiz.rawContent.questions.length;
  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const isAnswered = selectedAnswers[currentQuestionIndex] !== undefined;

  const handleSelectOption = (optionKey: string) => {
    if (quizFinished) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionKey
    }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    activeQuiz.rawContent.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const handleFinishAndSaveQuiz = async () => {
    const endTime = Date.now();
    const durationSeconds = Math.max(1, Math.round((endTime - quizStartTime) / 1000));
    const score = calculateScore();
    const accuracy = Math.round((score / totalQuestions) * 100);

    const newAttempt: QuizHistoryAttempt = {
      attemptId: `ATTEMPT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      score,
      totalQuestions,
      duration: durationSeconds,
      accuracy
    };

    try {
      const root = await navigator.storage.getDirectory();
      const historyDir = await root.getDirectoryHandle('history_quiz', { create: true });
      const historyFileName = `${activeQuiz.fileName.replace('.json', '')}_history.json`;

      let historyFileContent: QuizHistoryFile = {
        quizFileName: activeQuiz.fileName,
        attempts: []
      };

      try {
        const fileHandle = await historyDir.getFileHandle(historyFileName);
        const file = await fileHandle.getFile();
        const text = await file.text();
        historyFileContent = JSON.parse(text);
      } catch {
        // Chưa có file lịch sử trước đó
      }

      historyFileContent.attempts.push(newAttempt);

      const fileHandle = await historyDir.getFileHandle(historyFileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(historyFileContent, null, 2));
      await writable.close();
    } catch (err) {
      console.error("Không thể ghi lịch sử làm bài vào OPFS:", err);
    }

    setQuizFinished(true);
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizFinished(false);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-white text-[#2D3436] p-5 lg:p-8 animate-in fade-in duration-300">
      {/* HEADER PHẦN LÀM BÀI */}
      <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-5 mb-6">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-xs font-black text-[#727E82] hover:text-[#FF3399] transition-colors uppercase tracking-wider"
        >
          <ArrowLeft size={16} strokeWidth={3} /> Thoát làm bài
        </button>
        <div className="text-right">
          <h2 className="text-sm font-black text-[#2D3436] line-clamp-1 max-w-[250px] sm:max-w-md">
            {activeQuiz.knowledgeBase}
          </h2>
          <p className="text-[10px] text-[#B2BEC3] font-bold uppercase tracking-wider mt-0.5">
            Chế độ luyện tập cục bộ
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* THANH TIẾN ĐỘ */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2 text-xs font-black text-[#727E82] tracking-wide">
            <span>TIẾN ĐỘ THỰC HIỆN</span>
            <span className="font-mono text-[#FF3399]">
              {currentQuestionIndex + 1}/{totalQuestions} CÂU
            </span>
          </div>
          <div className="w-full h-3 bg-[#F0F2F5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF3399] transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {!quizFinished ? (
          /* GIAO DIỆN HỎI VÀ ĐÁP */
          <div className="space-y-6">
            <div className="bg-[#F7F9FB] rounded-2xl p-6 border border-[#E5E5E5]/60">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-[#FF3399] text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg shadow-[0_2px_0_0_#D12A7E]">
                  CÂU HỎI {currentQuestionIndex + 1}
                </span>
                <span className="text-[9px] font-mono font-bold text-[#B2BEC3] truncate">
                  ID: {currentQuestion?.chunkId || 'Unknown'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-[800] text-[#2D3436] leading-relaxed">
                {currentQuestion?.question}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentQuestion && Object.entries(currentQuestion.options).map(([key, value]) => {
                const isCurrentSelected = selectedAnswers[currentQuestionIndex] === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectOption(key)}
                    className={`w-full text-left p-4 rounded-xl border border-b-4 transition-all flex items-start gap-3 active:translate-y-0.5 active:border-b-2 ${
                      isCurrentSelected
                        ? "bg-[#FFF0F7] border-[#FF3399] border-b-[#D12A7E] text-[#FF3399]"
                        : "bg-white border-[#E5E5E5] border-b-[#CCC] text-[#2D3436] hover:bg-[#F7F9FB] hover:border-[#B2BEC3]"
                    }`}
                  >
                    <span className={`font-mono font-black px-2 py-0.5 text-xs rounded-md shrink-0 mt-0.5 ${
                      isCurrentSelected ? "bg-[#FF3399] text-white" : "bg-[#F7F9FB] border border-[#E5E5E5] text-[#727E82]"
                    }`}>
                      {key}
                    </span>
                    <span className="text-sm font-bold leading-normal">{value}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-5 py-2.5 border border-[#E5E5E5] text-xs font-black text-[#727E82] rounded-xl hover:bg-[#F7F9FB] disabled:opacity-40 disabled:cursor-not-allowed uppercase transition-all"
              >
                Câu trước
              </button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  disabled={!isAnswered}
                  className="px-6 py-2.5 bg-[#2D3436] text-white text-xs font-black rounded-xl border-b-4 border-black active:translate-y-0.5 active:border-b-0 disabled:bg-[#EBF0F2] disabled:text-[#B2BEC3] disabled:border-b-0 disabled:translate-y-0 disabled:cursor-not-allowed uppercase tracking-wide transition-all"
                >
                  Câu kế tiếp
                </button>
              ) : (
                <button
                  onClick={handleFinishAndSaveQuiz}
                  disabled={!isAnswered}
                  className="px-6 py-2.5 bg-[#00CEC9] text-white text-xs font-black rounded-xl border-b-4 border-[#00A8A3] active:translate-y-0.5 active:border-b-0 disabled:bg-[#EBF0F2] disabled:text-[#B2BEC3] disabled:border-b-0 disabled:translate-y-0 disabled:cursor-not-allowed uppercase tracking-wide transition-all"
                >
                  Nộp bài & Chấm điểm
                </button>
              )}
            </div>
          </div>
        ) : (
          /* MÀN HÌNH KẾT QUẢ CHẤM ĐIỂM */
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 text-center space-y-6 shadow-sm animate-in zoom-in-95 duration-200">
            <div className="max-w-xs mx-auto space-y-2">
              <div className="text-4xl">🏆</div>
              <h3 className="text-lg font-black text-[#2D3436] uppercase tracking-tight">KẾT QUẢ BÀI LÀM</h3>
              <div className="bg-[#FFF0F7] border border-[#FF3399]/20 rounded-2xl py-4 px-6">
                <p className="text-2xl font-black text-[#FF3399]">
                  {calculateScore()} <span className="text-sm font-bold text-[#727E82]">/ {totalQuestions} câu đúng</span>
                </p>
                <p className="text-[11px] text-[#727E82] font-bold mt-1 uppercase tracking-wide">
                  Tỷ lệ chính xác: {Math.round((calculateScore() / totalQuestions) * 100)}%
                </p>
              </div>
            </div>

            <div className="text-left border-t border-[#F0F0F0] pt-6 space-y-4">
              <h4 className="text-xs font-black text-[#727E82] uppercase tracking-wider mb-2">Xem lại chi tiết đáp án:</h4>
              {activeQuiz.rawContent.questions.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.answer;
                return (
                  <div key={idx} className={`p-4 rounded-xl border text-sm ${isCorrect ? 'border-[#00CEC9]/30 bg-[#F0FDFC]' : 'border-[#FF7675]/30 bg-[#FFF5F5]'}`}>
                    <div className="flex items-start gap-2.5 mb-1.5">
                      {isCorrect ? (
                        <CheckCircle2 size={16} className="text-[#00CEC9] shrink-0 mt-0.5" />
                      ) : (
                        <XCircle size={16} className="text-[#FF7675] shrink-0 mt-0.5" />
                      )}
                      <p className="font-extrabold text-[#2D3436]">Câu {idx + 1}: {q.question}</p>
                    </div>
                    <div className="pl-6 text-xs font-bold space-y-1 text-[#636E72]">
                      <p>Lựa chọn của bạn: <span className={`font-mono font-black ${isCorrect ? 'text-[#00CEC9]' : 'text-[#FF7675]'}`}>{userAns}</span> - {q.options[userAns]}</p>
                      {!isCorrect && (
                        <p className="text-[#00CEC9]">Đáp án chính xác: <span className="font-mono font-black">{q.answer}</span> - {q.options[q.answer]}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={handleResetQuiz}
                className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#E5E5E5] text-xs font-black text-[#727E82] rounded-xl hover:bg-[#F7F9FB] uppercase tracking-wide transition-all"
              >
                <RotateCcw size={14} strokeWidth={3} /> Làm lại bài
              </button>
              <button
                onClick={onExit}
                className="px-6 py-2.5 bg-[#FF3399] text-white text-xs font-black rounded-xl border-b-4 border-[#D12A7E] active:translate-y-0.5 active:border-b-0 uppercase tracking-wide transition-all"
              >
                Quay về trang quản lý
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
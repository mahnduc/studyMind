// QuizSummaryModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Award, BarChart2, Calendar, Play } from 'lucide-react';
import { QuizCardData, QuizHistoryAttempt, QuizHistoryFile } from '../types';

interface QuizSummaryModalProps {
  quiz: QuizCardData;
  onClose: () => void;
  onStartQuiz: () => void;
}

export default function QuizSummaryModal({ quiz, onClose, onStartQuiz }: QuizSummaryModalProps) {
  const [history, setHistory] = useState<QuizHistoryAttempt[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    async function loadQuizHistory() {
      try {
        setLoadingHistory(true);
        const root = await navigator.storage.getDirectory();
        
        const historyDir = await root.getDirectoryHandle('history_quiz', { create: true });
        const historyFileName = `${quiz.fileName.replace('.json', '')}_history.json`;
        
        try {
          const fileHandle = await historyDir.getFileHandle(historyFileName);
          const file = await fileHandle.getFile();
          const text = await file.text();
          const data: QuizHistoryFile = JSON.parse(text);
          setHistory(data.attempts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } catch {
          setHistory([]);
        }
      } catch (err) {
        console.error("Lỗi đọc lịch sử từ OPFS:", err);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadQuizHistory();
  }, [quiz]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} giây`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const totalAttempts = history.length;
  const avgAccuracy = totalAttempts > 0 
    ? Math.round(history.reduce((sum, item) => sum + item.accuracy, 0) / totalAttempts) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[28px] border border-[#E5E5E5] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-start justify-between p-6 border-b border-[#F0F0F0]">
          <div>
            <span className="text-[10px] font-black px-2.5 py-0.5 bg-[#FFF0F7] text-[#FF3399] rounded-lg border border-[#FF3399]/10 uppercase tracking-wider">
              Thông tin tổng quát
            </span>
            <h2 className="text-lg font-[900] text-[#2D3436] mt-1.5 leading-snug line-clamp-2">
              {quiz.knowledgeBase}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[#F7F9FB] text-[#B2BEC3] hover:text-[#2D3436] rounded-xl transition-all"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Nội dung cuộn bên trong */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Thống kê nhanh bộ câu hỏi */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#F7F9FB] border border-[#E5E5E5]/50 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-black text-[#727E82] uppercase tracking-wide">Số câu hỏi</p>
              <p className="text-xl font-[900] text-[#2D3436] mt-0.5">{quiz.totalQuestions}</p>
            </div>
            <div className="bg-[#F0FDFC] border border-[#00CEC9]/10 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-black text-[#00A8A3] uppercase tracking-wide">Đã làm</p>
              <p className="text-xl font-[900] text-[#00CEC9] mt-0.5">{totalAttempts} lần</p>
            </div>
            <div className="bg-[#FFF0F7] border border-[#FF3399]/10 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-black text-[#D12A7E] uppercase tracking-wide">Độ chính xác TB</p>
              <p className="text-xl font-[900] text-[#FF3399] mt-0.5">{avgAccuracy}%</p>
            </div>
          </div>

          {/* Danh sách lịch sử làm bài */}
          <div>
            <h3 className="text-xs font-black text-[#727E82] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart2 size={14} className="text-[#FF3399]" /> Lịch sử luyện tập cục bộ
            </h3>

            {loadingHistory ? (
              <div className="text-center py-6 text-xs text-[#B2BEC3] font-bold uppercase">Đang tải lịch sử...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 bg-[#F7F9FB] rounded-2xl border border-dashed border-[#E5E5E5] p-4">
                <p className="text-xs text-[#727E82] font-bold">Bạn chưa làm bài kiểm tra này lần nào.</p>
                <p className="text-[11px] text-[#B2BEC3] font-semibold mt-0.5">Hãy bấm bắt đầu luyện tập để ghi lại điểm số đầu tiên!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                {history.map((attempt, index) => (
                  <div 
                    key={attempt.attemptId} 
                    className="flex items-center justify-between p-3.5 bg-white border border-[#E5E5E5] rounded-xl hover:bg-[#F7F9FB] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-[#F7F9FB] rounded-lg flex items-center justify-center font-mono text-xs font-black text-[#B2BEC3] border border-[#F0F0F0]">
                        #{totalAttempts - index}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#2D3436]">
                          <span className="flex items-center gap-1 text-[#727E82]">
                            <Calendar size={12} /> {formatDate(attempt.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#B2BEC3]">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {formatDuration(attempt.duration)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-[#FF3399]">
                        {attempt.score} <span className="text-[10px] text-[#727E82] font-bold">/ {attempt.totalQuestions} câu</span>
                      </p>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase tracking-tighter ${
                        attempt.accuracy >= 80 ? 'bg-[#E3FAF5] text-[#00A8A3]' : attempt.accuracy >= 50 ? 'bg-[#FFF3E0] text-[#EF6C00]' : 'bg-[#FFEBEE] text-[#C62828]'
                      }`}>
                        Đúng {attempt.accuracy}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bấm Bắt đầu làm bài */}
        <div className="p-5 border-t border-[#F0F0F0] bg-[#F7F9FB] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-[#E5E5E5] text-xs font-black text-[#727E82] bg-white rounded-xl hover:bg-[#F7F9FB] uppercase transition-all"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onClose();
              onStartQuiz();
            }}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-[#FF3399] text-white text-xs font-black rounded-xl border-b-4 border-[#D12A7E] active:translate-y-0.5 active:border-b-0 uppercase tracking-wide transition-all"
          >
            <Play size={14} fill="currentColor" /> Bắt đầu luyện tập
          </button>
        </div>

      </div>
    </div>
  );
}
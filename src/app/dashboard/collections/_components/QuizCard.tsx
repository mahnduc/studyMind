'use client';

import React from 'react';
import { HelpCircle, Info, Clock, History } from 'lucide-react';
import { QuizCardData } from '@/types/quiz.type';

interface QuizCardProps {
  quiz: QuizCardData;
  onClick: () => void;
  onHistoryClick: () => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz, onClick, onHistoryClick }) => {
  const formatDate = (dateString: string) => {
    try {
      return dateString.split('T')[0];
    } catch {
      return "2026-05-30";
    }
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHistoryClick();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white border border-[#E5E5E5] rounded-2xl p-6 text-left shadow-sm flex flex-col justify-between h-full w-full select-none cursor-pointer"
    >
      <div className="w-full flex flex-col h-full justify-between">
        <div>
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#FF3399]/10 flex items-center justify-center border border-[#FF3399]/20">
              <HelpCircle size={22} className="text-[#FF3399]" />
            </div>
            
            <div
              onClick={handleInfoClick}
              className="p-1.5 rounded-lg text-[#FF3399] bg-[#FF3399]/5 transition-all cursor-pointer"
              title="Xem lịch sử luyện tập"
            >
              <History size={18} />
            </div>
          </div>

          <h3 className="text-base font-black text-[#2D3436] tracking-tight truncate w-full">
            {quiz.knowledgeBase}
          </h3>
        </div>

        <div className="mt-5 pt-3 border-t border-[#F2F2F2] flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="px-2 py-0.5 bg-[#FF3399]/10 text-[#FF3399] text-[10px] font-black uppercase rounded-md tracking-wide whitespace-nowrap">
              {quiz.totalQuestions} Câu hỏi
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#B2BEC3] font-bold whitespace-nowrap">
              <Clock size={11} />
              {formatDate(quiz.createdAt)}
            </span>
          </div>
          
          <span className="text-[11px] font-black text-[#FF3399] uppercase tracking-wider flex items-center gap-1 whitespace-nowrap shrink-0">
            Luyện tập &rarr;
          </span>
        </div>
      </div>
    </button>
  );
};
'use client';

import React from 'react';
import { BookOpen, User, Clock, ChevronRight } from 'lucide-react';
import { QuizCardData } from '../types';

interface QuizCardProps {
  quiz: QuizCardData;
  onClick: () => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz, onClick }) => {
  const formatDate = (dateString: string) => {
    try {
      return dateString.split('T')[0];
    } catch {
      return "2026-05-19";
    }
  };

  return (
    <div 
      onClick={onClick} 
      className="group bg-white p-5 rounded-[24px] border border-[#F0F0F0] border-b-[4px] hover:border-[#FF3399]/20 transition-all flex flex-col relative cursor-pointer"
    >
      {/* Header Card */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-black px-2 py-1 bg-[#F7F9FB] text-[#B2BEC3] rounded-md border border-[#F0F0F0]">
          {/* {quiz.id} */}Quiz
        </span>
        <BookOpen size={16} className="text-[#E5E5E5] group-hover:text-[#FF3399] transition-colors" />
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-[800] text-[#2D3436] mb-5 leading-snug min-h-[42px] line-clamp-2">
        {quiz.knowledgeBase}
      </h3>

      {/* Meta Content */}
      <div className="mt-auto flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 bg-[#FFF0F7] text-[#FF3399] text-[9px] font-black uppercase tracking-tighter rounded-md border border-[#FF3399]/10">
            {quiz.totalQuestions} CÂU HỎI
          </span>
          <span className="px-2.5 py-1 bg-[#F7F9FB] text-[#636E72] text-[9px] font-black uppercase tracking-tighter rounded-md border border-[#F0F0F0] truncate max-w-[150px]">
            {quiz.fileName.replace('_quiz.json', '')}
          </span>
        </div>

        {/* Footer Card */}
        <div className="flex items-center justify-between text-[11px] font-bold text-[#B2BEC3] pt-4 border-t border-[#F0F0F0]">
          <div className="flex items-center gap-1.5">
            <User size={12} className="text-[#00CEC9]" />
            <span className="truncate max-w-[80px]">Local_RAG</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>{formatDate(quiz.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Hover Icon */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
        <ChevronRight size={14} className="text-[#FF3399]" strokeWidth={3} />
      </div>
    </div>
  );
};
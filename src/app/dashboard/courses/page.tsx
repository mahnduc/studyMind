'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, HelpCircle } from "lucide-react";
import { QuizCardData } from './types';
import QuizSummaryModal from './_components/QuizSummaryModal';
import QuizActiveSession from './_components/QuizActiveSession';
import Link from 'next/link';
import { QuizCard } from './_components/QuizCard';

export default function CoursePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [quizzes, setQuizzes] = useState<QuizCardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSummaryQuiz, setSelectedSummaryQuiz] = useState<QuizCardData | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizCardData | null>(null);

  // Dùng useRef để đảm bảo scan chỉ chạy đúng 1 lần dù StrictMode
  const hasScanned = useRef(false);

  useEffect(() => {
    if (hasScanned.current) return;
    hasScanned.current = true;

    async function scanOPFSForQuizzes() {
      try {
        setLoading(true);
        const root = await navigator.storage.getDirectory();

        // Dùng Map với uniqueKey = đường dẫn thật để dedup tuyệt đối
        const quizMap = new Map<string, QuizCardData>();

        for await (const [name, handle] of root.entries()) {
          if (handle.kind === 'directory' && name !== 'history_quiz') {
            const dirHandle = await root.getDirectoryHandle(name);

            for await (const [fileName, fileHandle] of dirHandle.entries()) {
              if (fileHandle.kind === 'file' && fileName.endsWith('_quiz.json')) {
                // uniqueKey = đường dẫn thật, dùng làm id luôn để tránh counter trùng
                const uniqueKey = `${name}/${fileName}`;
                if (quizMap.has(uniqueKey)) continue;

                try {
                  const file = await (fileHandle as FileSystemFileHandle).getFile();
                  const text = await file.text();
                  const content = JSON.parse(text);

                  quizMap.set(uniqueKey, {
                    id: uniqueKey, 
                    fileName: fileName,
                    knowledgeBase: content.knowledgeBase || name,
                    createdAt: content.createdAt || new Date().toISOString(),
                    totalQuestions: content.totalQuestions || content.questions?.length || 0,
                    rawContent: content
                  });
                } catch (jsonErr) {
                  console.error(`Lỗi parse JSON tệp ${fileName}:`, jsonErr);
                }
              }
            }
          }
        }

        // Set 1 lần duy nhất sau khi scan xong toàn bộ
        setQuizzes(Array.from(quizMap.values()));
      } catch (err) {
        console.error("Không thể quét hệ thống tệp OPFS:", err);
      } finally {
        setLoading(false);
      }
    }

    scanOPFSForQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.knowledgeBase.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartQuiz = (quiz: QuizCardData) => {
    setSelectedSummaryQuiz(null);
    setActiveQuiz(quiz);
  };

  if (activeQuiz) {
    return (
      <QuizActiveSession
        activeQuiz={activeQuiz}
        onExit={() => setActiveQuiz(null)}
      />
    );
  }

  return (
    <div className="w-full flex flex-col gap-8 p-5 lg:p-8 animate-in fade-in duration-500">

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-7 bg-[#FF3399] rounded-full"></div>
            <h1 className="text-xl font-[900] text-[#2D3436] tracking-tight">
              Học phần <span className="text-[#FF3399]">Trắc nghiệm</span>
            </h1>
          </div>
          <p className="text-[11px] text-[#B2BEC3] font-black ml-4 uppercase tracking-widest">
            {quizzes.length} Bộ đề thi cục bộ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B2BEC3]" />
            <input
              type="text"
              placeholder="Tìm kiếm kho tri thức..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-60 bg-white border border-[#E5E5E5] rounded-xl pl-10 pr-4 py-2 text-[13px] focus:border-[#FF3399]/50 transition-all outline-none text-[#2D3436] font-bold"
            />
          </div>

          <button className="p-2 bg-white rounded-xl text-[#B2BEC3] border border-[#E5E5E5] hover:text-[#FF3399] transition-all">
            <Filter size={18} strokeWidth={2.5} />
          </button>
          <Link href="/dashboard/courses/create">
            <button className="px-4 py-2 bg-[#FF3399] text-white text-[13px] font-black rounded-xl border-b-4 border-[#D12A7E] active:translate-y-0.5 active:border-b-0 uppercase tracking-wide transition-all shadow-sm hover:bg-[#ff47a4]">
              + Tạo mới
            </button>
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <div className="w-8 h-8 border-3 border-[#FF3399] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-[#727E82] font-bold uppercase tracking-wider">Đang quét hệ thống tệp OPFS...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto py-20 opacity-80">
          <div className="w-12 h-12 bg-[#F7F9FB] rounded-xl flex items-center justify-center text-[#B2BEC3] mb-3 border border-[#E5E5E5]/60">
            <HelpCircle size={20} />
          </div>
          <h4 className="text-sm font-bold text-[#2D3436]">Không tìm thấy tệp trắc nghiệm</h4>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}  // ✅ key = path thật, stable và unique tuyệt đối
              quiz={quiz}
              onClick={() => setSelectedSummaryQuiz(quiz)}
            />
          ))}
        </div>
      )}

      {selectedSummaryQuiz && (
        <QuizSummaryModal
          quiz={selectedSummaryQuiz}
          onClose={() => setSelectedSummaryQuiz(null)}
          onStartQuiz={() => handleStartQuiz(selectedSummaryQuiz)}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E5E5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #B2BEC3;
        }
      `}</style>
    </div>
  );
}
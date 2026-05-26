'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, HelpCircle, BookOpen, Sparkles, Layers, UserPen } from "lucide-react";
import { QuizCardData } from './types';
import QuizSummaryModal from './_components/QuizSummaryModal';
import QuizActiveSession from './_components/QuizActiveSession';
import Link from 'next/link';
import { QuizCard } from './_components/QuizCard';

interface OfficialCourseData {
  id: string;
  title: string;
  description: string;
  category: 'Vocabulary' | 'Grammar' | 'Communication';
  thumbnailColor: string;
}

const OFFICIAL_COURSES_MOCK: OfficialCourseData[] = [
  {
    id: 'dictionary',
    title: 'Từ điển tiếng Anh',
    description: 'Tra cứu từ vựng và tạo flashcard nhanh chóng, tiện lợi và thông minh.',
    category: 'Vocabulary',
    thumbnailColor: 'from-[#00CEC9] to-[#00A8A3]'
  },
  {
    id: 'flashcard',
    title: 'Ghi nhớ từ vựng',
    description: 'Hệ thống ghi nhớ thông qua thẻ từ vựng.',
    category: 'Vocabulary',
    thumbnailColor: 'from-[#B2BEC3] to-[#2D3436]'
  },
];

export default function CoursePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'quizzes' | 'courses'>('all');
  const [quizzes, setQuizzes] = useState<QuizCardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSummaryQuiz, setSelectedSummaryQuiz] = useState<QuizCardData | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizCardData | null>(null);

  const hasScanned = useRef(false);

  useEffect(() => {
    if (hasScanned.current) return;
    hasScanned.current = true;

    async function scanOPFSForQuizzes() {
      try {
        setLoading(true);
        const root = await navigator.storage.getDirectory();
        const quizMap = new Map<string, QuizCardData>();

        for await (const [name, handle] of root.entries()) {
          if (handle.kind === 'directory' && name !== 'history_quiz') {
            const dirHandle = await root.getDirectoryHandle(name);

            for await (const [fileName, fileHandle] of dirHandle.entries()) {
              if (fileHandle.kind === 'file' && fileName.endsWith('_quiz.json')) {
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

  const filteredCourses = OFFICIAL_COURSES_MOCK.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="w-full flex flex-col gap-8 p-5 lg:p-8 animate-in fade-in duration-500 bg-[#F7F9FB] min-h-screen">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-7 bg-[#2D3436] rounded-full"></div>
            <h1 className="text-2xl font-[800] text-[#2D3436] tracking-tight flex items-center gap-2">
              Kho Học Liệu <span className="text-[#00CEC9]">Thông Minh</span>
            </h1>
          </div>
          <p className="text-xs text-[#B2BEC3] font-medium ml-4">
            Quản lý tài liệu học tập cá nhân hóa & lộ trình đào tạo chuẩn hóa bài bản.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B2BEC3]" />
            <input
              type="text"
              placeholder="Tìm đề thi hoặc khóa học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-[#F7F9FB] border border-[#E5E5E5] rounded-xl pl-10 pr-4 py-2.5 text-[13px] focus:border-[#FF3399] transition-all outline-none text-[#2D3436] font-semibold"
            />
          </div>

          <button className="p-2.5 bg-white rounded-xl text-[#B2BEC3] border border-[#E5E5E5] hover:text-[#FF3399] transition-all shadow-sm">
            <Filter size={18} strokeWidth={2.5} />
          </button>
          
          <Link href="/dashboard/courses/create">
            <button className="px-5 py-2.5 bg-[#FF3399] hover:filter hover:brightness-105 text-white text-[13px] font-black rounded-xl border-b-4 border-[#D12A7E] active:translate-y-0.5 active:border-b-2 uppercase tracking-wide transition-all shadow-sm flex items-center gap-2 cursor-pointer">
              <Sparkles size={14} className="text-white" /> Tạo mới
            </button>
          </Link>
        </div>
      </header>

      {/* TABS NAVIGATION (Phong cách Bento Menu) */}
      <div className="flex p-1 bg-[#E5E5E5]/50 backdrop-blur-md rounded-xl max-w-md border border-[#E5E5E5]/30 shadow-inner">
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'all' ? 'bg-white text-[#2D3436] shadow-sm' : 'text-[#B2BEC3] hover:text-[#2D3436]'}`}
        >
          <Layers size={14} /> Tất cả
        </button>
        <button 
          onClick={() => setActiveTab('courses')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'courses' ? 'bg-white text-[#00CEC9] shadow-sm' : 'text-[#B2BEC3] hover:text-[#00CEC9]'}`}
        >
          <BookOpen size={14} /> Thư viện
        </button>
        <button 
          onClick={() => setActiveTab('quizzes')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'quizzes' ? 'bg-white text-[#FF3399] shadow-sm' : 'text-[#B2BEC3] hover:text-[#FF3399]'}`}
        >
          <UserPen size={14} /> Cá nhân
        </button>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center text-center py-24 bg-white rounded-2xl border border-[#E5E5E5]">
          <div className="w-8 h-8 border-3 border-[#00CEC9] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xs text-[#B2BEC3] font-black uppercase tracking-wider">Đang cấu trúc lại không gian lưu trữ OPFS...</p>
        </div>
      )}

      {/* RENDER CONTENT */}
      {!loading && (
        <div className="flex flex-col gap-10">
          
          {/* SECTION 1: KHÓA HỌC HỆ THỐNG CUNG CẤP */}
          {(activeTab === 'all' || activeTab === 'courses') && (
            <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-3 duration-300">
              <div className="flex items-center gap-2 px-1">
                <BookOpen size={18} className="text-[#00CEC9]" />
                <h2 className="text-base font-[900] text-[#2D3436] uppercase tracking-wide">Thư viện</h2>
                <span className="text-[10px] bg-[#00CEC9]/10 text-[#00A8A3] font-black px-2 py-0.5 rounded-full">Public</span>
              </div>
              
              {filteredCourses.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-[#E5E5E5] text-[#B2BEC3] text-xs font-bold">Không tìm thấy khóa học phù hợp.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <div 
                      key={course.id} 
                      className="bg-white rounded-2xl border border-[#E5E5E5] p-5 shadow-sm flex flex-col justify-between relative overflow-hidden"
                    >
 
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B2BEC3] bg-[#F7F9FB] border border-[#E5E5E5] px-2 py-1 rounded-md">
                          {course.category}
                        </span>
                        <h3 className="text-base font-[900] text-[#2D3436] mt-3 line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-xs text-[#B2BEC3] font-semibold mt-2 line-clamp-2 leading-relaxed">
                          {course.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-[#F7F9FB] flex items-center justify-end">
                        <Link href={`/dashboard/courses/${course.id}`} className="block">
                          <button className="text-xs font-black text-white bg-[#2D3436] hover:bg-[#00CEC9] px-5 py-2 rounded-xl transition-all shadow-sm cursor-pointer">
                            Truy cập
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: BỘ TRẮC NGHIỆM TỰ ĐỘNG (DỮ LIỆU CÁ NHÂN TỪ OPFS) */}
          {(activeTab === 'all' || activeTab === 'quizzes') && (
            <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-3 duration-500 delay-75">
              <div className="flex items-center gap-2 px-1">
                <UserPen size={18} className="text-[#FF3399]" />
                <h2 className="text-base font-[900] text-[#2D3436] uppercase tracking-wide">Bộ đề trắc nghiệm cá nhân</h2>
                <span className="text-[10px] bg-[#FF3399]/10 text-[#FF3399] font-black px-2 py-0.5 rounded-full">Personal</span>
              </div>

              {filteredQuizzes.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-14 bg-white rounded-2xl border border-[#E5E5E5] opacity-90 max-w-md mx-auto w-full">
                  <div className="w-10 h-10 bg-[#F7F9FB] rounded-xl flex items-center justify-center text-[#B2BEC3] mb-3 border border-[#E5E5E5]">
                    <HelpCircle size={18} />
                  </div>
                  <h4 className="text-xs font-black text-[#2D3436] uppercase tracking-wider">Kho đề trống </h4>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredQuizzes.map((quiz) => (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      onClick={() => setSelectedSummaryQuiz(quiz)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* MODAL XEM TRƯỚC ĐỀ THI */}
      {selectedSummaryQuiz && (
        <QuizSummaryModal
          quiz={selectedSummaryQuiz}
          onClose={() => setSelectedSummaryQuiz(null)}
          onStartQuiz={() => handleStartQuiz(selectedSummaryQuiz)}
        />
      )}

      {/* CUSTOM STYLE FOR BENTO HOVER EFFECTS */}
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
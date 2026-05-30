'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  Sparkles, 
  UserPen, 
  FolderOpen, 
  Bookmark, 
  Plus, 
  X,
  ArrowLeft,
  Trophy,
  Calendar
} from "lucide-react";
import Link from 'next/link';

import VocabularyList from './_components/VocabularyList';
import { useCollection } from '@/hooks/useCollection';
import { QuizCard } from './_components/QuizCard';
import QuizPracticeScreen from '@/components/quiz/QuizPracticeScreen';
import { SavedQuizData } from '@/lib/rag/qa-generator';

// Import các types chuẩn từ hệ thống của bạn
import { 
  QuizCardData, 
  QuizHistoryAttempt, 
  QuizHistoryFile, 
  QuizFileContent 
} from '@/types/quiz.type';
import QuizHistoryDashboard from '@/components/quiz/QuizHistory';

export default function LibraryPage() {
  const [quizzes, setQuizzes] = useState<QuizCardData[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState<boolean>(true);
  const [activeQuiz, setActiveQuiz] = useState<QuizCardData | null>(null);
  
  // Trạng thái quản lý xem lịch sử chuẩn hóa theo Types
  const [historyQuiz, setHistoryQuiz] = useState<QuizCardData | null>(null);
  const [historyData, setHistoryData] = useState<QuizHistoryAttempt[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const hasScanned = useRef(false);

  const {
    collections,
    selectedCollection,
    isLoading: loadingCollections,
    error: collectionError,
    isModalOpen,
    newCollectionName,
    isDeleting,
    deletingWordIndex,
    localWordsList,
    isAddModalOpen,
    newWord,
    isAddingWord,
    setIsModalOpen,
    setNewCollectionName,
    setIsAddModalOpen,
    setNewWord,
    handleSpeak,
    handleCreateCollection,
    handleSelectCollection,
    handleDeleteCollection,
    handleDeleteWord,
    handleAddWord,
    resetSelection,
  } = useCollection();

  useEffect(() => {
    if (hasScanned.current) return;
    hasScanned.current = true;

    async function scanOPFSForQuizzes() {
      try {
        setLoadingQuizzes(true);
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
                  const content = JSON.parse(text) as QuizFileContent;

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
        setLoadingQuizzes(false);
      }
    }

    scanOPFSForQuizzes();
  }, []);

  // Xử lý đọc lịch sử chuẩn xác dựa theo định dạng file: [fileName bỏ đuôi]_history.json
  const handleOpenHistory = async (quiz: QuizCardData) => {
    setHistoryQuiz(quiz);
    setLoadingHistory(true);
    try {
      const root = await navigator.storage.getDirectory();
      const historyDirHandle = await root.getDirectoryHandle("history_quiz");
      
      // Bóc tách chuẩn: "newdesign_quiz.json" -> "newdesign" -> "newdesign_history.json"
      const baseName = quiz.fileName.replace('_quiz.json', '').replace('.json', '');
      const historyFileName = `${baseName}_history.json`;
      
      const fileHandle = await historyDirHandle.getFileHandle(historyFileName);
      const file = await fileHandle.getFile();
      const text = await file.text();
      const parsed = JSON.parse(text) as QuizHistoryFile;
      
      // Lấy mảng dữ liệu thử nghiệm đúng cấu trúc
      const attempts = parsed.attempts || [];
      setHistoryData([...attempts].reverse()); // Đảo ngược để lượt làm mới nhất lên đầu
    } catch (err) {
      console.warn(`[OPFS History] Chưa có dữ liệu hoặc lỗi đọc lịch sử cho đề: ${quiz.fileName}`, err);
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return dateString.split('T')[0];
    } catch {
      return "2026-05-30";
    }
  };

  /* --- 1. MÀN HÌNH LUYỆN TẬP QUIZ --- */
  if (activeQuiz && activeQuiz.rawContent) {
    const formattedQuizData = activeQuiz.rawContent as unknown as SavedQuizData;
    return (
      <div className="w-full flex flex-col items-center justify-center p-5 lg:p-8 bg-[#F7F9FB] min-h-screen">
        <QuizPracticeScreen
          quizData={formattedQuizData} 
          onBack={() => setActiveQuiz(null)}
        />
      </div>
    );
  }

  if (historyQuiz) {
    return (
      <QuizHistoryDashboard
        historyQuiz={historyQuiz}
        historyData={historyData}
        loadingHistory={loadingHistory}
        onBack={() => setHistoryQuiz(null)}
        formatDate={formatDate}
      />
    );
  }

  if (selectedCollection) {
    return (
      <div className="w-full flex flex-col gap-8 p-5 lg:p-8 bg-[#F7F9FB] min-h-screen animate-in fade-in duration-300">
        <VocabularyList
          selectedCollection={selectedCollection}
          isLoading={loadingCollections}
          error={collectionError}
          scrollbarClass="scrollbar-thin scrollbar-thumb-[#E5E5E5] scrollbar-track-transparent hover:scrollbar-thumb-[#B2BEC3]"
          isDeleting={isDeleting}
          deletingWordIndex={deletingWordIndex}
          localWordsList={localWordsList}
          isAddModalOpen={isAddModalOpen}
          newWord={newWord}
          isAddingWord={isAddingWord}
          setIsAddModalOpen={setIsAddModalOpen}
          setNewWord={setNewWord}
          onBack={resetSelection}
          onSpeak={handleSpeak}
          onDeleteCollection={handleDeleteCollection}
          onDeleteWord={handleDeleteWord}
          onAddWord={handleAddWord}
        />
      </div>
    );
  }

  const isLoadingTotal = loadingQuizzes || loadingCollections;

  return (
    <div className="w-full flex flex-col gap-8 p-5 lg:p-8 animate-in fade-in duration-500 bg-[#F7F9FB] min-h-screen selection:bg-[#00CEC9]/20 selection:text-[#00b2b0]">

      {/* GLOBAL LOADING STATE */}
      {isLoadingTotal && (
        <div className="flex flex-col items-center justify-center text-center py-24 bg-white rounded-2xl border border-[#E5E5E5]">
          <div className="w-8 h-8 border-3 border-[#00CEC9] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xs text-[#B2BEC3] font-black uppercase tracking-wider">Đang cấu trúc lại không gian lưu trữ cục bộ...</p>
        </div>
      )}

      {/* MAIN RENDER ENGINE */}
      {!isLoadingTotal && (
        <div className="flex flex-col gap-10">
          
          {/* PHÂN ĐOẠN 1: BỘ SƯU TẬP TỪ VỰNG CÁ NHÂN */}
          <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-[#00CEC9]" />
                  <h2 className="text-base font-[900] text-[#2D3436] uppercase tracking-wide">Bộ sưu tập từ vựng cá nhân</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1 bg-[#00CEC9] hover:bg-[#00b2b0] text-white text-[11px] font-black rounded-lg active:translate-y-0.5 uppercase tracking-wide transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={12} strokeWidth={2.5} /> Bộ từ vựng mới
                </button>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded-full uppercase">Local Storage</span>
            </div>

            {collections.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-[#E5E5E5] text-[#B2BEC3] text-xs font-bold shadow-sm">
                Chưa có bộ sưu tập từ vựng cá nhân nào được tạo.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-stretch">
                {collections.map((fileName, index) => (
                  <div key={index} className="w-full flex flex-col">
                    <button
                      type="button"
                      onClick={() => handleSelectCollection(fileName)}
                      className="bg-white border border-[#E5E5E5] rounded-2xl p-6 text-left shadow-sm cursor-pointer flex flex-col justify-between h-full w-full select-none"
                    >
                      <div className="w-full flex flex-col h-full justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#00CEC9]/10 flex items-center justify-center border border-[#00CEC9]/20">
                              <FolderOpen size={22} className="text-[#00CEC9]" />
                            </div>
                            <Bookmark size={18} className="text-[#00CEC9]" />
                          </div>
                          <h3 className="text-base font-[900] text-[#2D3436] tracking-tight truncate">
                            {fileName.replace('.json', '')}
                          </h3>
                          <p className="text-[11px] text-[#B2BEC3] mt-1 font-semibold truncate">
                             Bộ sưu tập từ vựng
                          </p>
                        </div>
                        <div className="w-full mt-5 pt-3 border-t border-[#F2F2F2] flex items-center justify-end">
                          <span className="text-[11px] font-black text-[#00CEC9] uppercase tracking-wider">
                            Xem chi tiết &rarr;
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PHÂN ĐOẠN 2: BỘ ĐỀ TRẮC NGHIỆM CÁ NHÂN (CHỐNG VỠ CARD) */}
          <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-3 duration-500 delay-75">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <UserPen size={18} className="text-[#FF3399]" />
                  <h2 className="text-base font-[900] text-[#2D3436] uppercase tracking-wide">Bộ đề trắc nghiệm cá nhân</h2>
                </div>
                <Link href="/dashboard/discover">
                  <button type="button" className="px-3 py-1 bg-[#FF3399] hover:filter hover:brightness-105 text-white text-[11px] font-black rounded-lg border-b-2 border-[#D12A7E] active:translate-y-0.5 active:border-b-0 uppercase tracking-wide transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
                    <Sparkles size={12} className="text-white" /> Tạo mới
                  </button>
                </Link>
              </div>
              <span className="text-[10px] bg-[#FF3399]/10 text-[#FF3399] font-black px-2 py-0.5 rounded-full uppercase">OPFS Engine</span>
            </div>

            {quizzes.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-14 bg-white rounded-2xl border border-[#E5E5E5] opacity-90 max-w-md mx-auto w-full shadow-sm">
                <div className="w-10 h-10 bg-[#F7F9FB] rounded-xl flex items-center justify-center text-[#B2BEC3] mb-3 border border-[#E5E5E5]">
                  <HelpCircle size={18} />
                </div>
                <h4 className="text-xs font-black text-[#2D3436] uppercase tracking-wider">Kho đề trống</h4>
                <p className="text-[11px] text-[#B2BEC3] font-medium mt-1">Hãy tạo đề thi mới từ tài liệu PDF/Markdown của bạn.</p>
              </div>
            ) : (
              /* auto-rows-stretch kết hợp w-full flex flex-col giúp chống vỡ layout hoàn toàn */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-stretch">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="w-full flex flex-col">
                    <QuizCard
                      quiz={quiz}
                      onClick={() => setActiveQuiz(quiz)} 
                      onHistoryClick={() => handleOpenHistory(quiz)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL TẠO BỘ TỪ VỰNG MỚI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={16} strokeWidth={2.5} />
            </button>

            <div className="mb-5">
              <h2 className="text-base font-bold text-[#2D3436] tracking-tight">
                Tạo bộ sưu tập từ vựng mới
              </h2>
              <p className="text-xs text-[#B2BEC3] mt-0.5 font-medium">
                Phân tách từ vựng theo các mục tiêu ôn luyện riêng của bạn.
              </p>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-[#B2BEC3] uppercase tracking-wider mb-2">
                  Tên bộ từ vựng
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Ví dụ: Oxford 3000, Core Vocab..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00CEC9] focus:ring-2 focus:ring-[#00CEC9]/10 text-[#2D3436] font-semibold placeholder:text-slate-400 bg-[#F7F9FB] transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!newCollectionName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#00CEC9] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#00b2b0] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
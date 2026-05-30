'use client';

import React from 'react';
import { Volume2, Loader2, AlertCircle, BookOpen, ArrowLeft, Trash2, Plus, X, MirrorRectangular } from 'lucide-react';
import Link from 'next/link';
import { SavedWord } from '@/hooks/useCollection';

interface VocabularyListProps {
  selectedCollection: string;
  isLoading: boolean;
  error: string | null;
  scrollbarClass: string;
  isDeleting: boolean;
  deletingWordIndex: number | null;
  localWordsList: SavedWord[];
  isAddModalOpen: boolean;
  newWord: string;
  isAddingWord: boolean;
  setIsAddModalOpen: (isOpen: boolean) => void;
  setNewWord: (text: string) => void;
  onBack: () => void;
  onSpeak: (text: string) => void;
  onDeleteCollection: () => Promise<void>;
  onDeleteWord: (index: number, word: string) => Promise<void>;
  onAddWord: () => Promise<void>;
}

export default function VocabularyList({
  selectedCollection,
  isLoading,
  error,
  scrollbarClass,
  isDeleting,
  deletingWordIndex,
  localWordsList,
  isAddModalOpen,
  newWord,
  isAddingWord,
  setIsAddModalOpen,
  setNewWord,
  onBack,
  onSpeak,
  onDeleteCollection,
  onDeleteWord,
  onAddWord,
}: VocabularyListProps) {
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            disabled={isDeleting || deletingWordIndex !== null}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:border-[#00CEC9] hover:text-[#00CEC9] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">
                {selectedCollection.replace('.json', '')}
              </h2>
              <p className="text-xs text-slate-400 font-mono tracking-wider">
                {localWordsList.length} WORDS
              </p>
            </div>
            <Link href="/dashboard/collections/flashcard">
              <button
                className="w-8 h-8 rounded-lg bg-emerald-50/10 text-[#00CEC9] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                title="Flashcard"
              >
                <MirrorRectangular size={24} />
              </button>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#00CEC9] text-white hover:bg-[#00b2b0] rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            Thêm từ mới
          </button>
          <button
            onClick={onDeleteCollection}
            disabled={isDeleting || isLoading || deletingWordIndex !== null}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100/80 border border-red-200/60 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Đang xóa...
              </>
            ) : (
              <Trash2 size={15} />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`min-h-[400px] ${scrollbarClass}`}>
        {isLoading ? (
          <div className="h-[300px] flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-[#00CEC9]" size={30} />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : error ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <AlertCircle size={40} className="text-red-500 mb-3" />
            <p className="text-sm font-bold text-red-500">{error}</p>
          </div>
        ) : localWordsList.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center">
            <BookOpen size={40} className="text-slate-200 mb-3" />
            <p className="text-sm font-bold text-slate-400">
              Bộ từ vựng này chưa có dữ liệu
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {localWordsList.map((item, index) => (
              <div
                key={`${item.word}-${index}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative group"
              >
                <div className="flex items-start justify-between border-b border-slate-50 pb-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 capitalize pr-16">
                      {item.word}
                    </h3>
                    {item.phonetics?.length > 0 && (
                      <span className="inline-block mt-1 text-xs font-mono bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-slate-400">
                        {item.phonetics.join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSpeak(item.word)}
                      className="p-2.5 bg-slate-50 hover:bg-[#FF3399]/10 border border-slate-200 hover:border-[#FF3399]/20 rounded-xl transition-all text-slate-600 hover:text-[#FF3399] cursor-pointer"
                    >
                      <Volume2 size={15} />
                    </button>
                    <button
                      onClick={() => onDeleteWord(index, item.word)}
                      disabled={deletingWordIndex !== null || isDeleting}
                      className="p-2.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition-all text-slate-400 hover:text-red-500 disabled:opacity-40 cursor-pointer"
                      title="Xóa từ này"
                    >
                      {deletingWordIndex === index ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <X size={15} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {item.partsOfSpeech?.map((pos, posIdx) => (
                    <div key={posIdx} className="space-y-2">
                      <span className="inline-block text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-lg bg-[#FF3399]/10 text-[#FF3399] border border-[#FF3399]/20">
                        {pos.partOfSpeech}
                      </span>
                      <div className="pl-3 border-l-2 border-slate-200 space-y-2">
                        <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                          {pos.definitionEn}
                        </p>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {pos.definitionVi}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Word Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-800">
                Thêm từ mới
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Ví dụ: beautiful"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#00CEC9]"
            />
            <button
              onClick={onAddWord}
              disabled={!newWord.trim() || isAddingWord}
              className="w-full h-12 rounded-xl bg-[#00CEC9] hover:bg-[#00b2b0] text-white font-bold transition-all disabled:opacity-40 cursor-pointer"
            >
              {isAddingWord ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Đang tạo dữ liệu...
                </span>
              ) : (
                'Tạo & Lưu'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
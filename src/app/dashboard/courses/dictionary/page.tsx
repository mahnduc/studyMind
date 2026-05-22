'use client';

import React, { useState } from 'react';
import { Search, Bookmark, Sparkles, Cpu, HelpCircle, Volume2 } from 'lucide-react';
import { useDictionary, CustomDictionaryEntry } from './useDictionary';
import DictionaryResult from './_components/DictionaryResult';
import CollectionModal from './_components/CollectionModal';

export default function DictionaryPage() {
  console.log('[Page Render] Đang render DictionaryPage component');

  const {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    error,
    isModelLoading,
    isSaved,
    setIsSaved,
    goToWord,
    playAudio,
  } = useDictionary();

  const [showPopup, setShowPopup] = useState(false);
  const [currentWordEntry, setCurrentWordEntry] = useState<CustomDictionaryEntry | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTerm = searchTerm.trim();
    console.log(`[Page Action] Submit form tìm kiếm với từ khóa: "${cleanTerm}"`);
    if (!cleanTerm) return;
    goToWord(cleanTerm);
  };

  const handleBookmarkClick = (entry: CustomDictionaryEntry) => {
    console.log('[Page Action] Nhấp mở modal lưu bộ sưu tập cho từ:', entry.word);
    setCurrentWordEntry(entry);
    setShowPopup(true);
  };

  return (
    <div className="w-full min-h-screen p-6 md:p-8 flex flex-col gap-6 antialiased bg-[#f7f9f8] text-[#2d3436] font-['DM_Sans'] selection:bg-[#FF339920] selection:text-[#2d3436]">
      
      {isModelLoading && (
        <div className="bg-[#2d3436] text-[#f7f9f8] rounded-[24px] px-6 py-4 flex items-start gap-3 w-full max-w-[720px] mx-auto">
          <div className="w-6 h-6 rounded-full bg-[#00cec920] flex items-center justify-center flex-shrink-0 text-[#00cec9]">
            <Cpu size={14} />
          </div>
          <p className="text-xs font-[600] tracking-wide text-[#f7f9f8]/90 leading-relaxed pt-0.5">
            Hệ thống đang khởi chạy! Vui lòng chờ đợi trong giây lát...
          </p>
        </div>
      )}

      <div className="bg-white rounded-[24px] shadow-sm p-6 space-y-4 w-full max-w-[720px] mx-auto">
        <div>
          <h1 className="text-sm font-['Nunito'] font-[900] text-[#2d3436] tracking-wider uppercase flex items-center gap-2">
            <Sparkles size={16} className="fill-[#FF3399] text-[#FF3399]" />
            Tra cứu từ vựng
          </h1>
          <p className="text-xs text-[#2d3436]/50 mt-0.5">Tra cứu nhanh & Lưu trữ tối giản nghĩa Anh - Việt</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
          <input
            type="text"
            placeholder="Nhập từ vựng bất kỳ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#f7f9f8] rounded-[16px] pl-5 pr-14 py-3.5 text-sm font-mono text-[#2d3436] placeholder:font-normal placeholder:text-[#2d3436]/40 outline-none"
          />
          <button
            type="submit"
            title="Tìm kiếm"
            className="absolute right-4 text-[#2d3436]/40 p-1.5 rounded-full cursor-pointer hover:text-[#2d3436] transition-colors"
          >
            <Search size={16} strokeWidth={3} />
          </button>
        </form>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[24px] gap-4 w-full max-w-[720px] mx-auto flex-1">
          <div className="w-9 h-9 border-4 border-[#FF3399] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-['Nunito'] font-[800] tracking-wider text-[#2d3436]/40 uppercase text-center px-6 max-w-sm leading-relaxed">
            Hệ thống đang tra cứu dữ liệu...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[24px] gap-4 w-full max-w-[720px] mx-auto flex-1">
          <div className="w-12 h-12 bg-[#FF339915] rounded-[40%] flex items-center justify-center text-[#FF3399]">
            <HelpCircle size={24} strokeWidth={2.5} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-['Nunito'] font-[900] text-[#2d3436]">Đã xảy ra lỗi tra cứu</p>
            <p className="text-xs font-[500] text-[#2d3436]/50 max-w-xs px-4">
              Không thể xử lý từ vựng này. Vui lòng kiểm tra lại chính tả hoặc thử một từ khác.
            </p>
          </div>
        </div>
      )}

      {!loading && (!results || results.length === 0) && !error && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[24px] gap-4 w-full max-w-[720px] mx-auto flex-1">
          <div className="w-14 h-14 bg-[#00cec915] rounded-[40%] flex items-center justify-center text-[#00cec9]">
            <Search size={26} strokeWidth={2.5} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-['Nunito'] font-[900] text-[#2d3436]">Hệ thống từ điển thông minh</p>
            <p className="text-xs font-[500] text-[#2d3436]/40 max-w-sm mx-auto leading-relaxed px-6">
              Nhập từ vựng bất kỳ để phân tích định nghĩa phổ thông nhất.
            </p>
          </div>
        </div>
      )}

      {results && results.length > 0 && !loading && !error && (
        <div className="space-y-6 w-full">
          {results.map((entry: CustomDictionaryEntry, entryIdx: number) => {
            console.log(`[Page Render] Đang render thẻ kết quả cho từ: "${entry.word}"`);
            return (
              <div key={entryIdx} className="space-y-4 w-full">
                
                <div className="bg-white rounded-[24px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 w-full max-w-[720px] mx-auto">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-4xl font-['Nunito'] font-[900] text-[#2d3436] tracking-tight capitalize">
                        {entry.word}
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          console.log('[Page Action] Kích hoạt loa phát âm từ chính:', entry.word);
                          playAudio(entry.word);
                        }}
                        title="Phát âm từ vựng"
                        className="w-8 h-8 rounded-full bg-[#00cec915] text-[#00cec9] flex items-center justify-center cursor-pointer hover:bg-[#00cec925] transition-colors mt-1"
                      >
                        <Volume2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                    
                    {entry.ai?.phonetic && (
                      <span className="inline-block text-sm font-mono text-[#2d3436]/60 bg-[#f7f9f8] px-3 py-1 rounded-md">
                        {entry.ai.phonetic}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleBookmarkClick(entry)}
                      title={isSaved ? 'Xem các bộ sưu tập' : 'Lưu từ vựng'}
                      className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xs cursor-pointer bg-[#f7f9f8] hover:bg-[#e9eceb] transition-colors ${
                        isSaved ? 'text-[#FF3399]' : 'text-[#2d3436]/40'
                      }`}
                    >
                      <Bookmark size={18} strokeWidth={2.5} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                <DictionaryResult 
                  entry={entry} 
                  playAudio={playAudio} 
                />

              </div>
            );
          })}
        </div>
      )}

      <CollectionModal 
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        currentWordEntry={currentWordEntry}
        allPhonetics={[{ text: results?.[0]?.ai?.phonetic, audio: '' }]}
        onSaveSuccess={() => {
          console.log('[Page Event] Lưu từ vựng thành công qua Modal!');
          setIsSaved(true);
        }}
      />
    </div>
  );
}
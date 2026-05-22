"use client";

import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Volume2, Plus, Loader2, AlertCircle, ChevronDown, FolderOpen, FileJson, Check } from 'lucide-react';

interface PartOfSpeech {
  partOfSpeech: string;
  definitionEn: string;
  definitionVi: string;
}

interface SavedWord {
  word: string;
  phonetics: string[];
  partsOfSpeech: PartOfSpeech[];
}

export default function OPFSCollectionPage() {
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [wordsList, setWordsList] = useState<SavedWord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; 
      utterance.rate = 0.9;     
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadCollections = async () => {
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle('system-collections', { create: true });
      
      const fileNames: string[] = [];
      // @ts-ignore
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
          fileNames.push(entry.name);
        }
      }
      setCollections(fileNames);
    } catch (err) {
      console.error('Lỗi quét thư mục OPFS:', err);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleSelectCollection = async (fileName: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedCollection(fileName);
    setIsDropdownOpen(false);
    
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle('system-collections', { create: true });
      const fileHandle = await dirHandle.getFileHandle(fileName);
      
      const file = await fileHandle.getFile();
      const text = await file.text();
      
      const cleanText = text.trim();
      
      if (cleanText && cleanText !== "[]" && cleanText !== "{}") {
        try {
          const parsedData = JSON.parse(cleanText);
          const cleanData: SavedWord[] = Array.isArray(parsedData) ? parsedData : [parsedData];
          setWordsList(cleanData);
        } catch (parseErr) {
          console.error('Lỗi định dạng JSON:', parseErr);
          setWordsList([]);
          setError('Tệp tin chứa cấu trúc JSON không hợp lệ hoặc bị lỗi cú pháp.');
        }
      } else {
        setWordsList([]);
      }
    } catch (err) {
      console.error('Lỗi hệ thống tập tin:', err);
      setWordsList([]);
      setError('Hệ thống không thể đọc hoặc truy cập nội dung tệp tin này.');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollbarClass = "overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-[#E5E5E5] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#B2BEC3]";

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 bg-[#F7F9FB] min-h-screen flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="w-full bg-white p-4 md:p-5 rounded-2xl border border-[#E5E5E5] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 z-30">
        
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[#00CEC9] rounded-full"></div>
          <div>
            <h2 className="text-sm font-[900] text-[#2D3436] uppercase tracking-wide">
              Không gian lưu trữ
            </h2>
            <p className="text-[10px] text-[#B2BEC3] font-bold uppercase tracking-wider mt-0.5">Bộ sưu tập cá nhân</p>
          </div>
        </div>

        {/* KHU VỰC DROPDOWN COMPONENT */}
        <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
          <div className="relative w-full sm:w-72" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-[#E5E5E5] hover:border-[#B2BEC3] rounded-xl text-xs font-[800] text-[#2D3436] transition-all cursor-pointer shadow-xs font-mono"
            >
              <div className="flex items-center gap-2 truncate">
                <FolderOpen size={15} className="text-[#00CEC9] shrink-0" />
                <span className="truncate">
                  {selectedCollection ? selectedCollection.replace('.json', '') : 'Chọn bộ sưu tập từ vựng...'}
                </span>
              </div>
              <ChevronDown size={14} className={`text-[#B2BEC3] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#2D3436]' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-full bg-white border border-[#E5E5E5] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className={`max-h-60 p-1.5 space-y-1 ${scrollbarClass}`}>
                  {collections.length === 0 ? (
                    <div className="text-center py-6 text-[11px] text-[#B2BEC3] font-bold">
                      Không tìm thấy file bộ sưu tập nào
                    </div>
                  ) : (
                    collections.map((fileName) => {
                      const isSelected = selectedCollection === fileName;
                      return (
                        <button
                          key={fileName}
                          onClick={() => handleSelectCollection(fileName)}
                          className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-mono
                            ${isSelected 
                              ? 'bg-[#2D3436] text-white' 
                              : 'text-[#2D3436] hover:bg-[#F7F9FB]'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileJson size={14} className={isSelected ? 'text-[#00CEC9]' : 'text-[#B2BEC3]'} />
                            <span className="truncate">{fileName.replace('.json', '')}</span>
                          </div>
                          {isSelected && <Check size={14} className="text-[#00CEC9] shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            className="p-2.5 bg-[#F7F9FB] border border-[#E5E5E5] text-[#2D3436] hover:text-[#00CEC9] hover:border-[#00CEC9] rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
            title="Tạo mới một bộ từ vựng"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="w-full flex-1 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {selectedCollection ? (
          <>
            {/* Header của nội dung hiển thị */}
            <div className="px-6 py-4 border-b border-[#E5E5E5] bg-white flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-base font-[900] text-[#2D3436] font-mono tracking-tight">
                  Bộ sưu tập: <span className="text-[#00CEC9]">{selectedCollection.replace('.json', '')}</span>
                </h1>
              </div>
              {!error && !isLoading && (
                <span className="text-[11px] bg-[#00CEC9]/10 text-[#00CEC9] font-black px-3 py-1.5 rounded-xl border border-[#00CEC9]/20 font-mono">
                  {wordsList.length} DANH MỤC TỪ
                </span>
              )}
            </div>

            {/* Vùng Render Grid Thẻ Từ Vựng */}
            <div className={`flex-1 p-6 bg-[#F7F9FB] ${scrollbarClass}`}>
              {isLoading ? (
                <div className="h-64 w-full flex flex-col items-center justify-center text-[#B2BEC3] gap-3">
                  <Loader2 className="animate-spin text-[#00CEC9]" size={28} strokeWidth={3} />
                  <p className="text-xs font-black uppercase tracking-wider">Đang cấu trúc lại dữ liệu local...</p>
                </div>
              ) : error ? (
                <div className="h-64 w-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-3 border border-red-100">
                    <AlertCircle size={24} />
                  </div>
                  <h4 className="text-sm font-black text-[#2D3436] uppercase tracking-wide">Lỗi đồng bộ cấu trúc</h4>
                  <p className="text-xs text-red-500 font-medium mt-1.5 max-w-sm leading-relaxed">
                    {error}
                  </p>
                </div>
              ) : wordsList.length === 0 ? (
                <div className="h-64 w-full flex flex-col items-center justify-center text-[#B2BEC3]">
                  <BookOpen size={40} className="mb-3 text-[#E5E5E5]" />
                  <p className="text-xs font-bold">Bộ sưu tập này chưa có bản ghi dữ liệu từ vựng nào.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {wordsList.map((item, index) => (
                    <div 
                      key={`${item.word}-${index}`}
                      className="bg-white border border-[#E5E5E5] p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-[#B2BEC3] transition-all duration-200 flex flex-col justify-between animate-in fade-in-50 zoom-in-95 duration-200"
                    >
                      <div>
                        {/* Thanh Tiêu Đề Của Từ Vựng */}
                        <div className="flex items-start justify-between border-b border-[#F7F9FB] pb-3 mb-3 gap-2">
                          <div className="space-y-1 truncate">
                            <h3 className="text-lg font-[900] text-[#2D3436] tracking-tight capitalize truncate">{item.word}</h3>
                            {item.phonetics && item.phonetics.length > 0 && (
                              <span className="inline-block text-xs text-[#B2BEC3] font-bold font-mono bg-[#F7F9FB] border border-[#E5E5E5] px-2 py-0.5 rounded-lg">
                                {item.phonetics.join(', ')}
                              </span>
                            )}
                          </div>
                          
                          <button 
                            onClick={() => handleSpeak(item.word)}
                            className="p-2.5 bg-[#F7F9FB] hover:bg-[#FF3399]/10 text-[#2D3436] hover:text-[#FF3399] border border-[#E5E5E5] hover:border-[#FF3399]/20 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                            title="Nghe phát âm chuẩn"
                          >
                            <Volume2 size={15} strokeWidth={2.5} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {item.partsOfSpeech && item.partsOfSpeech.map((pos, posIdx) => (
                            <div key={posIdx} className="space-y-1.5 text-xs">
                              <span className="inline-block px-2 py-0.5 rounded-lg font-black uppercase text-[9px] bg-[#FF3399]/10 text-[#FF3399] border border-[#FF3399]/20 tracking-wider font-mono">
                                {pos.partOfSpeech}
                              </span>
                              <div className="space-y-1.5 pl-2 border-l-2 border-[#E5E5E5]">
                                <p className="text-[#2D3436] font-semibold leading-relaxed">
                                  <span className="text-[#B2BEC3] font-mono mr-1.5">EN:</span>{pos.definitionEn}
                                </p>
                                <p className="text-[#B2BEC3] font-medium leading-relaxed">
                                  <span className="text-[#E5E5E5] font-mono mr-1.5">VI:</span>
                                  <span className="text-[#2D3436]/80">{pos.definitionVi}</span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Trạng thái chưa chọn tệp ban đầu */
          <div className="flex-1 flex flex-col items-center justify-center text-[#B2BEC3] p-8 text-center bg-[#F7F9FB]">
            <div className="w-14 h-14 bg-white border border-[#E5E5E5] rounded-2xl flex items-center justify-center text-[#B2BEC3] mb-4 shadow-xs">
              <BookOpen size={22} />
            </div>
            <h3 className="text-xs font-black text-[#2D3436] uppercase tracking-wider">Chưa tải tệp dữ liệu</h3>
            <p className="text-[11px] text-[#B2BEC3] font-medium mt-1 max-w-xs leading-relaxed">
              Vui lòng mở thanh Dropdown phía trên để lựa chọn bộ từ vựng.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
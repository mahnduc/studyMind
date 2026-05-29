'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, FileText, Megaphone, Sparkles, RefreshCw, Plus, Star, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface NoteItem {
  content: string;
  updatedAt: string;
}

interface CategoryNotesData {
  [dateKey: string]: NoteItem;
}

type CategoryType = 'all' | 'normal' | 'announcement' | 'special';

interface FlattenedNote {
  dateKey: string;
  category: 'normal' | 'announcement' | 'special';
  content: string;
  updatedAt: string;
}

export default function NotesDisplayPage() {
  const router = useRouter();
  
  const [allNotes, setAllNotes] = useState<FlattenedNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<FlattenedNote[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<CategoryType>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Hàm chuyển đổi định dạng ngày hiển thị (YYYY-MM-DD -> DD/MM/YYYY)
  const formatDisplayDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  };

  // Hàm đọc dữ liệu từ OPFS
  const loadAllNotesFromOPFS = async () => {
    setIsLoading(true);
    const categories: ('normal' | 'announcement' | 'special')[] = ['normal', 'announcement', 'special'];
    const tempNotes: FlattenedNote[] = [];

    try {
      const root = await navigator.storage.getDirectory();
      const noteDir = await root.getDirectoryHandle('note', { create: true });

      for (const cat of categories) {
        const fileName = `${cat}_notes.json`;
        try {
          const fileHandle = await noteDir.getFileHandle(fileName, { create: false });
          const file = await fileHandle.getFile();
          const text = await file.text();
          
          if (text) {
            const parsedData: CategoryNotesData = JSON.parse(text);
            Object.keys(parsedData).forEach((dateKey) => {
              tempNotes.push({
                dateKey,
                category: cat,
                content: parsedData[dateKey].content,
                updatedAt: parsedData[dateKey].updatedAt,
              });
            });
          }
        } catch (e) {
          console.log(`Chưa có dữ liệu hoặc không đọc được file: ${fileName}`);
        }
      }

      setAllNotes(tempNotes);
      setFilteredNotes(tempNotes);
    } catch (error) {
      console.error("Lỗi truy cập hệ thống OPFS Sandbox:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllNotesFromOPFS();
  }, []);

  // Bộ lọc danh mục thay đổi
  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredNotes(allNotes);
    } else {
      setFilteredNotes(allNotes.filter(note => note.category === selectedFilter));
    }
  }, [selectedFilter, allNotes]);

  // Cấu hình UI mẫu cho Badge danh mục
  const getCategoryConfig = (cat: 'normal' | 'announcement' | 'special') => {
    switch (cat) {
      case 'announcement':
        return {
          label: 'Thông báo',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Megaphone size={12} className="text-blue-500" />
        };
      case 'special':
        return {
          label: 'Đặc biệt',
          bg: 'bg-rose-600 text-white border-rose-600',
          icon: <Sparkles size={12} fill="currentColor" className="text-white" />
        };
      default:
        return {
          label: 'Ghi chú',
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: <FileText size={12} className="text-gray-500" />
        };
    }
  };

  const getSegmentedAndSortedNotes = () => {
    const todayStr = new Date().toISOString().split('T')[0];

    const getPriorityWeight = (category: string) => {
      if (category === 'special') return 3;
      if (category === 'announcement') return 2;
      return 1;
    };

    const sortLogic = (a: FlattenedNote, b: FlattenedNote) => {
      const weightA = getPriorityWeight(a.category);
      const weightB = getPriorityWeight(b.category);
      if (weightA !== weightB) return weightB - weightA; 
      return a.dateKey.localeCompare(b.dateKey);
    };

    const todayNotes = filteredNotes.filter(note => note.dateKey === todayStr).sort(sortLogic);

    const futureNotes = filteredNotes.filter(note => note.dateKey > todayStr).sort(sortLogic);

    return { todayNotes, futureNotes };
  };

  const { todayNotes, futureNotes } = getSegmentedAndSortedNotes();
  const hasAnyContent = todayNotes.length > 0 || futureNotes.length > 0;

  return (
    <div className="w-full h-screen max-w-[1200px] mx-auto bg-slate-50/50 p-4 md:p-6 lg:p-8 flex flex-col gap-5 antialiased text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
      
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              selectedFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            Tất cả <span className="ml-1 text-[10px] opacity-70">({allNotes.length})</span>
          </button>
          
          <button
            onClick={() => setSelectedFilter('special')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              selectedFilter === 'special' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            Đặc biệt <span className="ml-1 text-[10px] opacity-70">({allNotes.filter(n => n.category === 'special').length})</span>
          </button>

          <button
            onClick={() => setSelectedFilter('announcement')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              selectedFilter === 'announcement' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            Thông báo <span className="ml-1 text-[10px] opacity-70">({allNotes.filter(n => n.category === 'announcement').length})</span>
          </button>

          <button
            onClick={() => setSelectedFilter('normal')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              selectedFilter === 'normal' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            Ghi chú <span className="ml-1 text-[10px] opacity-70">({allNotes.filter(n => n.category === 'normal').length})</span>
          </button>
        </div>

        <Link href="/dashboard/note" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap">
          <Plus size={14} strokeWidth={2.5} />
          <span>Tạo ghi chú</span>
        </Link>
      </div>
        
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
        
        <div className="md:col-span-2 flex flex-col gap-4 overflow-y-auto pr-1 scrollbar-thin">
          <div className="text-[11px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1.5 pb-1 border-b border-indigo-100">
            <CheckCircle2 size={13} className="text-indigo-500" />
            <span>Lịch trình hôm nay</span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <RefreshCw size={22} className="animate-spin text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Đang quét dữ liệu...</span>
            </div>
          ) : todayNotes.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed border-slate-200 bg-white/50 rounded-2xl px-6 flex flex-col items-center justify-center">
              <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-2">
                <FileText size={24} />
              </div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Hôm nay trống lịch</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Không tìm thấy bất kỳ ghi chú hoặc sự kiện nào đặt cho ngày hôm nay.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {todayNotes.map((note) => {
                const config = getCategoryConfig(note.category);
                const isSpecial = note.category === 'special';

                return (
                  <div 
                    key={`${note.category}-${note.dateKey}`} 
                    className={`p-5 rounded-2xl border shadow-sm flex flex-col gap-3 relative overflow-hidden transition-all ${
                      isSpecial 
                        ? 'bg-gradient-to-br from-white to-rose-50/30 border-rose-200/80' 
                        : 'bg-white border-slate-100'
                    }`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSpecial ? 'bg-rose-500' : 'bg-slate-300'}`} />
                    
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
                        <Calendar size={14} className={isSpecial ? 'text-rose-500' : 'text-slate-400'} />
                        <span className={isSpecial ? 'text-rose-950 font-black' : ''}>{formatDisplayDate(note.dateKey)}</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-50 text-emerald-600 rounded border border-emerald-200 uppercase tracking-wide">
                          Hôm nay
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 shadow-sm ${config.bg}`}>
                        {config.icon} {config.label}
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isSpecial ? 'text-slate-800 font-semibold' : 'text-slate-600 font-normal'}`}>
                      {note.content}
                    </p>

                    <div className="text-[10px] text-slate-400 font-medium text-right pt-2 border-t border-slate-100/60">
                      Cập nhật: {new Date(note.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto pl-1 scrollbar-thin">
          <div className="text-[11px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5 pb-1 border-b border-rose-100">
            <Star size={13} className="text-rose-500" fill="currentColor" />
            <span>Sự kiện tương lai sắp tới</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw size={20} className="animate-spin text-rose-500" />
            </div>
          ) : futureNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-rose-50/20 rounded-2xl border border-dashed border-rose-200/50">
              <Sparkles size={24} className="text-rose-300 mb-2 animate-pulse" />
              <h4 className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Không có sự kiện đặc biệt</h4>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                Không tìm thấy thông báo đặc biệt quan trọng nào sắp diễn ra trong những ngày tới.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {futureNotes.map((note) => {
                const config = getCategoryConfig(note.category);
                const isSpecial = note.category === 'special';

                return (
                  <div 
                    key={`future-${note.category}-${note.dateKey}`} 
                    className={`p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2.5 relative overflow-hidden shadow-sm ${
                      isSpecial 
                        ? 'bg-gradient-to-r from-rose-500 to-pink-600 border-rose-500 text-white' 
                        : 'bg-white border-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Calendar size={13} className={isSpecial ? 'text-white/80' : 'text-slate-400'} />
                        <span className={isSpecial ? 'text-white' : 'text-slate-700'}>
                          {formatDisplayDate(note.dateKey)}
                        </span>
                      </div>
                      
                      {isSpecial ? (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-sm flex items-center gap-1 border border-white/20">
                          <Sparkles size={10} fill="currentColor" /> ĐẶC BIỆT KHẨN
                        </span>
                      ) : (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${config.bg}`}>
                          {config.icon} {config.label}
                        </span>
                      )}
                    </div>

                    <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isSpecial ? 'text-white font-semibold' : 'text-slate-600 font-normal'}`}>
                      {note.content}
                    </p>

                    <div className={`text-[9px] font-medium text-right pt-2 border-t ${isSpecial ? 'text-white/60 border-white/10' : 'text-slate-400 border-slate-50'}`}>
                      {new Date(note.updatedAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
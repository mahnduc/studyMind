'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, CheckCircle, ChevronLeft, AlertCircle, Sparkles, Calendar } from 'lucide-react';

interface NoteItem {
  content: string;
  updatedAt: string;
}

interface CategoryNotesData {
  [dateKey: string]: NoteItem;
}

type CategoryType = 'normal' | 'announcement' | 'special';

export default function StructuralNotePage() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [noteContent, setNoteContent] = useState('');
  const [category, setCategory] = useState<CategoryType>('normal');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState('');

  const formatDisplayDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  };

  const getFileName = (cat: CategoryType) => {
    return `${cat}_notes.json`;
  };

  const readNoteFromOPFS = async (targetKey: string, currentCat: CategoryType) => {
    const fileName = getFileName(currentCat);
    try {
      const root = await navigator.storage.getDirectory();
      const noteDir = await root.getDirectoryHandle('note', { create: true });
      const fileHandle = await noteDir.getFileHandle(fileName, { create: false });
      const file = await fileHandle.getFile();
      const text = await file.text();
      const categoryNotes: CategoryNotesData = JSON.parse(text);
      const targetNote = categoryNotes[targetKey];
      if (targetNote) {
        setNoteContent(targetNote.content || '');
        setLastSaved(new Date(targetNote.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
      } else {
        setNoteContent('');
        setLastSaved('');
      }
    } catch {
      setNoteContent('');
      setLastSaved('');
    }
  };

  const writeNoteToOPFS = async (targetKey: string, content: string, currentCat: CategoryType) => {
    const fileName = getFileName(currentCat);
    try {
      const root = await navigator.storage.getDirectory();
      const noteDir = await root.getDirectoryHandle('note', { create: true });
      const fileHandle = await noteDir.getFileHandle(fileName, { create: true });
      let categoryNotes: CategoryNotesData = {};
      try {
        const file = await fileHandle.getFile();
        const text = await file.text();
        if (text) {
          categoryNotes = JSON.parse(text);
        }
      } catch (e) {
      }
      categoryNotes[targetKey] = {
        content,
        updatedAt: new Date().toISOString(),
      };
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(categoryNotes, null, 2));
      await writable.close();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  useEffect(() => {
    readNoteFromOPFS(selectedDate, category);
  }, [selectedDate, category]);

  const handleSave = async () => {
    setIsSaving(true);
    const ok = await writeNoteToOPFS(selectedDate, noteContent, category);
    setIsSaving(false);
    if (ok) {
      setSaveStatus('success');
      setLastSaved(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
      setTimeout(() => setSaveStatus('idle'), 2500);
    } else {
      setSaveStatus('error');
    }
  };

  const categoryBtnClass = (item: CategoryType) => {
    if (category !== item) {
      return 'bg-transparent text-gray-400 hover:text-gray-600';
    }
    return 'bg-gray-100 text-gray-900 font-extrabold';
  };

  return (
    <div className="w-full h-full bg-white px-4 py-6 md:px-8 max-w-[900px] mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <button
          onClick={() => router.push('/dashboard/notification')}
          className="flex items-center gap-1.5 text-[11px] font-black text-gray-400 hover:text-[#FF3399] transition-colors uppercase tracking-wider group"
        >
          <ChevronLeft size={16} strokeWidth={3} className="group-hover:-translate-x-0.5 transition-transform" />
          Quay lại bảng điều khiển
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg text-gray-500">
            <Calendar size={14} />
            <span className="text-[11px] font-bold uppercase tracking-wider hidden xs:inline">Ngày:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-0 p-0 text-[12px] font-bold text-gray-800 outline-none cursor-pointer focus:ring-0"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 text-white disabled:text-gray-400 text-[12px] font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <Save size={14} />
            <span>{isSaving ? 'ĐANG LƯU...' : 'LƯU LẠI'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 gap-4 min-h-[500px]">
        
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCategory('normal')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${categoryBtnClass('normal')}`}
            >
              Ghi chú
            </button>

            <button
              type="button"
              onClick={() => setCategory('announcement')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${categoryBtnClass('announcement')}`}
            >
              Thông báo
            </button>

            <button
              type="button"
              onClick={() => setCategory('special')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${categoryBtnClass('special')}`}
            >
              <Sparkles size={12} className={category === 'special' ? 'text-rose-500 animate-pulse' : ''} />
              Đặc biệt
            </button>
          </div>

          {lastSaved && (
            <span className="text-[11px] text-gray-400 font-medium">
              Đã lưu lúc: {lastSaved}
            </span>
          )}
        </div>

        {saveStatus === 'success' && (
          <div className="flex items-center gap-2 text-[#00A896] text-[11px] font-bold animate-fade-in py-1">
            <CheckCircle size={14} /> Đã ghi tệp cấu trúc thành công.
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-500 text-[11px] font-bold py-1">
            <AlertCircle size={14} /> Lỗi kết nối ghi file Sandbox.
          </div>
        )}

        <div className="flex-1 bg-[#f5f5f5] rounded-2xl p-6 md:p-8 transition-colors duration-200">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="w-full h-full min-h-[440px] bg-transparent outline-none resize-none border-0 p-0 text-[15px] font-medium focus:ring-0 leading-relaxed text-[#282828] placeholder:text-[#636363]"
            placeholder={`Bắt đầu nhập nội dung ghi chú cho ngày ${formatDisplayDate(selectedDate)} tại đây...`}
          />
        </div>

      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StickyNote, Save, CheckCircle, ChevronLeft, Clock, AlertCircle, Sparkles, Calendar } from 'lucide-react';

interface NoteItem {
  content: string;
  updatedAt: string;
}

// Cấu trúc trong mỗi file phân loại: Key là dateKey (yyyy-mm-dd)
interface CategoryNotesData {
  [dateKey: string]: NoteItem;
}

type CategoryType = 'normal' | 'announcement' | 'special';

export default function StructuralNotePage() {
  const router = useRouter();

  // Khởi tạo ngày hôm nay theo định dạng yyyy-mm-dd để làm giá trị mặc định cho ô Input
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

  // Định dạng hiển thị dd/mm/yyyy ra giao diện tiêu đề
  const formatDisplayDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  };

  // Hàm xác định tên file dựa vào loại ghi chú đang chọn
  const getFileName = (cat: CategoryType) => {
    return `${cat}_notes.json`;
  };

  // =========================
  // OPFS OPERATIONS (Đọc/Ghi theo file loại)
  // =========================
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
        // File có tồn tại nhưng ngày này chưa được ghi dữ liệu ở loại này
        setNoteContent('');
        setLastSaved('');
      }
    } catch {
      // Chưa từng tạo file của loại này hoặc file trống
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

      // Đọc dữ liệu cũ của file loại hiện tại để tránh ghi đè mất dữ liệu các ngày khác
      let categoryNotes: CategoryNotesData = {};
      try {
        const file = await fileHandle.getFile();
        const text = await file.text();
        if (text) {
          categoryNotes = JSON.parse(text);
        }
      } catch (e) {
        // Bỏ qua lỗi nếu file mới tinh chưa có nội dung
      }

      // Cập nhật hoặc thêm mới nội dung của ngày đang chọn vào file loại này
      categoryNotes[targetKey] = {
        content,
        updatedAt: new Date().toISOString(),
      };

      // Ghi lại toàn bộ dữ liệu vào file tương ứng
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(categoryNotes, null, 2));
      await writable.close();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Tự động chạy lại mỗi khi người dùng thay đổi Ngày HOẶC đổi Tab phân loại
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

  // =========================
  // STATIC CLASS MAPS
  // =========================
  const indicatorColor: Record<string, string> = {
    normal: 'bg-gray-400',
    announcement: 'bg-emerald-500',
    special: 'bg-rose-500',
  };

  const categoryBtnClass = (item: CategoryType) => {
    if (category !== item) {
      return 'bg-[#F7F9FB] border-[#F0F0F0] text-gray-500 hover:text-gray-700';
    }
    return 'bg-[#2D3436] border-black text-white shadow-sm scale-105';
  };

  return (
    <div className="w-full h-full bg-white p-4 lg:p-6 flex flex-col gap-5 max-w-[1000px] mx-auto overflow-y-auto">

      {/* BACK & DATE PICKER ROW */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-[11px] font-black text-[#B2BEC3] hover:text-[#FF3399] transition-colors uppercase tracking-wider group self-start sm:self-auto"
        >
          <ChevronLeft size={16} strokeWidth={3} className="group-hover:-translate-x-0.5 transition-transform" />
          Quay lại bảng điều khiển
        </button>

        {/* BỘ CHỌN NGÀY THÁNG NĂM */}
        <div className="flex items-center gap-2 bg-[#F7F9FB] border border-[#F0F0F0] px-3 py-1.5 rounded-xl shadow-sm focus-within:border-gray-300 transition-colors">
          <Calendar size={14} className="text-[#636E72]" />
          <span className="text-[11px] font-black text-[#636E72] uppercase tracking-wider hidden xs:inline">Chọn ngày:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-0 p-0 text-[12px] font-black text-[#2D3436] outline-none cursor-pointer focus:ring-0"
          />
        </div>
      </div>

      <div className="w-full bg-white rounded-[20px] border border-[#F0F0F0] shadow-sm p-5 flex flex-col gap-4 min-h-[550px] flex-1">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F7F9FB] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F7F9FB] rounded-xl text-gray-700 relative border border-[#F0F0F0]">
              <StickyNote size={20} className="text-[#FF3399]" />
              <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ring-2 ring-white transition-colors duration-300 ${indicatorColor[category]}`} />
            </div>
            <div>
              <h1 className="text-[15px] font-[900] text-[#2D3436]">
                Thiết lập ngày {formatDisplayDate(selectedDate)}
              </h1>
              <p className="text-[10px] font-black text-[#B2BEC3] uppercase tracking-wider">
                Tệp đang ghi dữ liệu: <span className="font-mono text-pink-600 lowercase font-bold">{getFileName(category)}</span>
              </p>
            </div>
          </div>

          {/* CHỌN PHÂN LOẠI (TAGS) */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setCategory('normal')}
              className={`px-3 py-1.5 text-[11px] font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer border ${categoryBtnClass('normal')}`}
            >
              Ghi chú
            </button>

            <button
              type="button"
              onClick={() => setCategory('announcement')}
              className={`px-3 py-1.5 text-[11px] font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer border ${categoryBtnClass('announcement')}`}
            >
              <AlertCircle size={12} />
              Thông báo
            </button>

            <button
              type="button"
              onClick={() => setCategory('special')}
              className={`px-3 py-1.5 text-[11px] font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer border ${categoryBtnClass('special')}`}
            >
              <Sparkles size={12} className={category === 'special' ? 'text-rose-500 animate-pulse' : ''} />
              Đặc biệt
            </button>
          </div>
        </div>

        {/* STATUS BAR */}
        {saveStatus === 'success' && (
          <div className="flex items-center gap-2 bg-[#E6FFFA] border border-[#B2F5EA] text-[#00A896] px-4 py-2 rounded-xl text-[11px] font-black animate-fade-in">
            <CheckCircle size={14} /> Ghi cấu trúc vào tệp tin thành công!
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-[11px] font-black">
            <AlertCircle size={14} /> Có lỗi xảy ra trong quá trình kết nối ghi file Sandbox!
          </div>
        )}

        {/* VÙNG NHẬP LIỆU MẶC ĐỊNH */}
        <div className="flex-1 rounded-[16px] border-2 border-solid p-4 transition-all duration-300 bg-[#F7F9FB] focus-within:bg-[#FAFAFA] border-gray-100 focus-within:border-gray-200">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="w-full h-full min-h-[300px] bg-transparent outline-none resize-none border-0 p-0 text-[13px] font-bold focus:ring-0 leading-relaxed text-[#2D3436] placeholder:text-[#B2BEC3]"
            placeholder={`Nhập nội dung cho ngày ${formatDisplayDate(selectedDate)} trong file ${getFileName(category)}...`}
          />
        </div>

        {/* CHÂN TRANG & NÚT LƯU */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#636E72]">
            <Clock size={13} />
            {lastSaved ? (
              <span>Cập nhật lần cuối của ngày này: <b className="text-[#2D3436] font-black">{lastSaved}</b></span>
            ) : (
              <span className="text-[#B2BEC3] italic">Ngày {formatDisplayDate(selectedDate)} trong file này chưa có dữ liệu</span>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#FF3399] hover:bg-[#D12A7E] disabled:bg-[#B2BEC3] text-white text-[13px] font-black rounded-[16px] flex items-center justify-center gap-2 transition-all active:translate-y-0.5 border-b-4 border-[#D12A7E] disabled:border-b-0 cursor-pointer shadow-md"
          >
            <Save size={16} />
            <span>{isSaving ? 'ĐANG GHI DỮ LIỆU...' : 'LƯU LẠI HỆ THỐNG'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
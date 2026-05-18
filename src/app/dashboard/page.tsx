'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar as CalendarIcon, Zap, 
  HardDrive, Bell, StickyNote, AlertCircle 
} from "lucide-react";
import Link from 'next/link';

interface NoteItem {
  content: string;
  updatedAt: string;
}

interface CategoryNotesData {
  [dateKey: string]: NoteItem;
}

interface RenderNoteItem {
  dateKey: string;
  displayDate: string;
  content: string;
  type: 'normal' | 'announcement' | 'special';
}

export default function HomePage() {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth(); 
  const currentYear = now.getFullYear();

  const monthDisplay = now.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
  const todayDisplay = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // States quản lý dữ liệu đọc từ OPFS
  const [normalNotes, setNormalNotes] = useState<RenderNoteItem[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<RenderNoteItem[]>([]);
  const [hasNoteDates, setHasNoteDates] = useState<Set<string>>(new Set());

  // Hàm định dạng hiển thị ngày từ key yyyy-mm-dd sang dd/mm
  const formatKeyToDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
  };

  // ==========================================
  // XỬ LÝ ĐỌC FILE TỪ OPFS (THƯ MỤC 'note')
  // ==========================================
  const loadAllNotesFromOPFS = async () => {
    try {
      const root = await navigator.storage.getDirectory();
      const noteDir = await root.getDirectoryHandle('note', { create: true });
      
      const categories: ('normal' | 'announcement' | 'special')[] = ['normal', 'announcement', 'special'];
      const loadedNormal: RenderNoteItem[] = [];
      const loadedAlerts: RenderNoteItem[] = [];
      const datesTracked = new Set<string>();

      for (const cat of categories) {
        const fileName = `${cat}_notes.json`;
        try {
          const fileHandle = await noteDir.getFileHandle(fileName, { create: false });
          const file = await fileHandle.getFile();
          const text = await file.text();
          
          if (text) {
            const data: CategoryNotesData = JSON.parse(text);
            
            // Duyệt qua từng ngày trong file cấu trúc phân loại
            Object.keys(data).forEach((dateKey) => {
              if (data[dateKey] && data[dateKey].content.trim() !== '') {
                // Đánh dấu ngày này có dữ liệu để hiển thị trên lịch
                datesTracked.add(dateKey);

                const item: RenderNoteItem = {
                  dateKey,
                  displayDate: formatKeyToDisplay(dateKey),
                  content: data[dateKey].content,
                  type: cat
                };

                if (cat === 'normal') {
                  loadedNormal.push(item);
                } else {
                  loadedAlerts.push(item);
                }
              }
            });
          }
        } catch (e) {
          // Bỏ qua lỗi nếu file phân loại chưa tồn tại
        }
      }

      // Sắp xếp danh sách theo ngày tăng dần/mới nhất (tùy chọn)
      const sortByDate = (a: RenderNoteItem, b: RenderNoteItem) => b.dateKey.localeCompare(a.dateKey);
      loadedNormal.sort(sortByDate);
      
      // Phân tách cấu trúc Thông báo: Đặc biệt lên trên, Thông báo thường xuống dưới
      const specialNotes = loadedAlerts.filter(item => item.type === 'special').sort(sortByDate);
      const announcementNotes = loadedAlerts.filter(item => item.type === 'announcement').sort(sortByDate);
      
      setNormalNotes(loadedNormal);
      setSystemAlerts([...specialNotes, ...announcementNotes]); // Ghép mảng: Đặc biệt nằm trên
      setHasNoteDates(datesTracked);

    } catch (error) {
      console.error("Lỗi khi tải cấu trúc file dữ liệu từ OPFS:", error);
    }
  };

  useEffect(() => {
    loadAllNotesFromOPFS();
  }, []);

  // Kiểm tra xem ngày cụ thể trên lịch có dữ liệu để đánh dấu chấm không
  const checkDateHasNote = (dayNum: number) => {
    const yyyy = currentYear;
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    return hasNoteDates.has(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <div className="w-full flex flex-col gap-5 p-4 lg:p-6 max-w-[1400px] mx-auto">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LỊCH */}
        <div className="lg:col-span-6 xl:col-span-5 bg-white rounded-[20px] border border-[#F0F0F0] shadow-sm flex flex-col">
          <div className="px-5 py-3 border-b border-[#F0F0F0] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarIcon className="text-[#FF3399]" size={18} />
              <h2 className="font-[900] text-[15px] text-[#2D3436] capitalize">{monthDisplay}</h2>
            </div>
            <Link href="/dashboard/note">
              <button 
                className="flex items-center gap-1.5 text-[10px] font-black text-[#FF3399] bg-[#FFF0F7] hover:bg-[#FF3399] hover:text-white px-2.5 py-1 rounded-md border border-[#FFCCD8] hover:border-transparent transition-all shadow-sm active:scale-95 group cursor-pointer"
                title="Xem ghi chú hôm nay"
              >
                <StickyNote size={12} strokeWidth={2.5} className="group-hover:rotate-6 transition-transform" />
                <span className="uppercase tracking-tight">Ghi chú ({todayDisplay})</span>
              </button>
            </Link>
          </div>

          <div className="p-4 grid grid-cols-7 gap-1.5">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
              <div key={d} className="text-center text-[11px] font-black text-[#B2BEC3] pb-1">{d}</div>
            ))}
            {days.map(d => {
              const isToday = d === currentDay;
              const hasData = checkDateHasNote(d);
              
              return (
                <div 
                  key={d} 
                  className={`aspect-square flex flex-col items-center justify-center gap-0.5 rounded-lg text-[14px] font-bold transition-all cursor-pointer relative
                    ${isToday 
                      ? 'bg-[#FF3399] text-white shadow-md shadow-[#FF3399]/20 scale-110 z-10' 
                      : 'hover:bg-[#F7F9FB] text-[#2D3436] border border-transparent hover:border-[#F0F0F0]'
                    }`}
                >
                  {/* Để số nhích lên một chút tạo không gian cho dấu chấm bên dưới */}
                  <span className={hasData ? "mt-1" : ""}>{d}</span>
                  
                  {/* DẤU CHẤM DƯỚI CHÂN SỐ */}
                  {hasData ? (
                    <span className={`w-1 h-1 rounded-full flex-shrink-0 ${isToday ? 'bg-white' : 'bg-[#FF3399]'}`} />
                  ) : (
                    /* Thêm một khoảng trống ẩn bằng kích thước dấu chấm khi không có data để số không bị nhảy lệch vị trí giữa các ô */
                    <span className="w-1 h-1 opaque-0 block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            
            {/* Streak */}
            <div className="bg-[#2D3436] rounded-[20px] p-5 text-white relative border-b-4 border-black overflow-hidden flex flex-col items-center justify-center text-center">
              <Zap className="absolute -right-2 -top-2 w-16 h-16 text-[#00CEC9] opacity-10" />
              <span className="text-[#00CEC9] text-[10px] font-black uppercase tracking-[0.2em] mb-2">Tính năng</span>
              <p className="text-[11px] font-bold text-[#B2BEC3] mt-2 italic">Đang chờ phát triển</p>
            </div>

            {/* HỘP THÔNG BÁO DỮ LIỆU (Đặc biệt nằm trên, Thông báo nằm dưới) */}
            <div className="bg-white rounded-[20px] border border-[#F0F0F0] p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={14} className="text-[#FF3399]" />
                <h3 className="text-[11px] font-black text-[#2D3436] uppercase">Thông báo & Đặc biệt</h3>
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[140px] pr-1 custom-scrollbar flex-1">
                {systemAlerts.length > 0 ? (
                  systemAlerts.map((alert, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-2 p-2 bg-[#F7F9FB] rounded-lg border border-[#F0F0F0] transition-all hover:bg-gray-50"
                    >
                      {alert.type === 'special' ? (
                        /* Loại ĐẶC BIỆT: Chấm đỏ nhấp nháy */
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse mt-1.5 flex-shrink-0" />
                      ) : (
                        /* Loại THÔNG BÁO: Chấm xanh ngọc */
                        <div className="w-1.5 h-1.5 bg-[#00CEC9] rounded-full mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[9px] font-black font-mono text-gray-400">
                          [{alert.displayDate}] - {alert.type === 'special' ? 'ĐẶC BIỆT' : 'THÔNG BÁO'}
                        </span>
                        <span className="text-[11px] font-bold text-[#636E72] line-clamp-2 leading-tight break-words">
                          {alert.content}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center py-4">
                    <span className="text-[11px] font-medium text-[#B2BEC3] italic">Không có thông báo hoặc ghi chú đặc biệt</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-4 h-[56px]">
            <Link href="/dashboard/courses/create" className="flex flex-1">
              <button className="flex-1 bg-[#FF3399] text-white rounded-[16px] flex items-center justify-center gap-2 font-black text-[14px] border-b-4 border-[#D12A7E] active:translate-y-0.5 active:border-b-0 transition-all shadow-md cursor-pointer">
                <Plus size={18} strokeWidth={4} />
                <span className="uppercase tracking-tight">Tạo bài học</span>
              </button>
            </Link>
            <Link href="/dashboard/opfs-explorer" className="flex flex-1">
              <div className="flex-1 bg-white border border-[#F0F0F0] rounded-[16px] flex items-center justify-center gap-3 border-b-4 border-[#E5E5E5] hover:bg-[#F7F9FB] cursor-pointer transition-colors">
                <HardDrive size={20} className="text-[#00CEC9]" />
                <div className="text-left">
                  <p className="text-[9px] font-black text-[#B2BEC3] leading-none uppercase">Storage</p>
                  <p className="text-[13px] font-[900] text-[#2D3436]">OPFS Active</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 2: GHI CHÚ THEO NGÀY (Hiển thị file normal_notes.json) */}
      <div className="bg-[#FFFBEB] rounded-[24px] border border-[#FEF3C7] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <StickyNote size={18} className="text-[#D97706]" />
          <h3 className="text-[14px] font-black text-[#92400E] uppercase tracking-wide">Ghi chú & Lịch trình</h3>
        </div>
        
        {normalNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {normalNotes.map((note, idx) => (
              <div key={idx} className="bg-white/80 p-3 rounded-xl border border-white flex flex-col gap-1 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                    {note.displayDate}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
                <p className="text-[12px] font-bold text-[#451A03] line-clamp-2 leading-normal break-words">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full py-6 flex flex-col items-center justify-center bg-white/40 rounded-xl border border-dashed border-[#FEF3C7]">
            <AlertCircle size={20} className="text-[#D97706] opacity-60 mb-1" />
            <p className="text-[12px] font-bold text-[#92400E] italic">Hệ thống chưa ghi nhận dữ liệu ghi chú lịch trình nào</p>
          </div>
        )}
      </div>

    </div>
  );
}
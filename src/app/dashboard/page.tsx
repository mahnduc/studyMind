'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar as CalendarIcon, Flame, Zap, 
  HardDrive, ChevronRight, Bell, StickyNote, 
  Clock, AlertCircle 
} from "lucide-react";
import Link from 'next/link';

export default function HomePage() {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth(); 
  const currentYear = now.getFullYear();

  const monthDisplay = now.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
  const todayDisplay = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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
             <span className="text-[10px] font-black text-[#FF3399] bg-[#FFF0F7] px-2 py-0.5 rounded-md">{todayDisplay}</span>
          </div>

          <div className="p-4 grid grid-cols-7 gap-1.5">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
              <div key={d} className="text-center text-[11px] font-black text-[#B2BEC3] pb-1">{d}</div>
            ))}
            {days.map(d => (
              <div key={d} className={`aspect-square flex items-center justify-center rounded-lg text-[14px] font-bold transition-all cursor-pointer
                ${d === currentDay 
                  ? 'bg-[#FF3399] text-white shadow-md shadow-[#FF3399]/20 scale-110' 
                  : 'hover:bg-[#F7F9FB] text-[#2D3436] border border-transparent hover:border-[#F0F0F0]'}`}>
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            
            {/* Streak - CĂN GIỮA SỐ */}
            <div className="bg-[#2D3436] rounded-[20px] p-5 text-white relative border-b-4 border-black overflow-hidden flex flex-col items-center justify-center text-center">
              <Zap className="absolute -right-2 -top-2 w-16 h-16 text-[#00CEC9] opacity-10" />
              <span className="text-[#00CEC9] text-[10px] font-black uppercase tracking-[0.2em] mb-2">Tính năng</span>
              <p className="text-[11px] font-bold text-[#B2BEC3] mt-2 italic">Đang chờ phát triển</p>
            </div>

            {/* Thông báo nhanh */}
            <div className="bg-white rounded-[20px] border border-[#F0F0F0] p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={14} className="text-[#FF3399]" />
                <h3 className="text-[11px] font-black text-[#2D3436] uppercase">Thông báo</h3>
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[80px] custom-scrollbar">
                <div className="flex items-center gap-2 p-2 bg-[#F7F9FB] rounded-lg border border-[#F0F0F0]">
                  <div className="w-1.5 h-1.5 bg-[#FF3399] rounded-full animate-pulse" />
                  <span className="text-[11px] font-bold text-[#636E72]">Cập nhật PGLite 1.2</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-[#F7F9FB] rounded-lg border border-[#F0F0F0]">
                  <div className="w-1.5 h-1.5 bg-[#00CEC9] rounded-full" />
                  <span className="text-[11px] font-bold text-[#636E72]">Hoàn thành mục tiêu</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-4 h-[56px]">
            <Link href="/dashboard/courses/create" className="flex flex-1">
            <button className="flex-1 bg-[#FF3399] text-white rounded-[16px] flex items-center justify-center gap-2 font-black text-[14px] border-b-4 border-[#D12A7E] active:translate-y-0.5 active:border-b-0 transition-all shadow-md">
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

      {/* SECTION 2: GHI CHÚ THEO NGÀY */}
      <div className="bg-[#FFFBEB] rounded-[24px] border border-[#FEF3C7] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <StickyNote size={18} className="text-[#D97706]" />
          <h3 className="text-[14px] font-black text-[#92400E] uppercase tracking-wide">Ghi chú & Lịch trình</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { date: "30/04", content: "Nghỉ lễ - Ôn tập nhẹ Rust", color: "bg-red-400" },
            { date: "01/05", content: "Triển khai Database cục bộ", color: "bg-blue-400" },
            { date: "02/05", content: "Tối ưu hóa UI/UX Mobile", color: "bg-green-400" }
          ].map((note, idx) => (
            <div key={idx} className="bg-white/80 p-3 rounded-xl border border-white flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded">{note.date}</span>
                <div className={`w-2 h-2 rounded-full ${note.color}`} />
              </div>
              <p className="text-[12px] font-bold text-[#451A03] line-clamp-1">{note.content}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
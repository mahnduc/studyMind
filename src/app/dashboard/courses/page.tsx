'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  User, 
  Clock, 
  ChevronRight,
  Filter,
  BookOpen
} from "lucide-react";
import Link from 'next/link';

export default function CoursePage() {
  const [searchTerm, setSearchTerm] = useState("");

  const courses = [
    { id: "DOC-001", title: "Advanced Neural Architectures", creator: "Admin_Dev", time: "2026-04-25", tags: ["AI", "Research"] },
    { id: "DOC-002", title: "Quantum Computing Logic", creator: "Quantum_Lab", time: "2026-04-20", tags: ["Physics", "Computing"] },
    { id: "DOC-003", title: "Rust Memory Management", creator: "Systems_Arch", time: "2026-04-18", tags: ["Systems", "Rust"] },
    { id: "DOC-004", title: "Cybersecurity Protocols", creator: "Net_Sec", time: "2026-04-15", tags: ["Security"] },
  ];

  return (
    /* Thu nhỏ padding tổng thể (p-5 lg:p-8) và gap giữa các khối (gap-8) */
    <div className="w-full flex flex-col gap-8 p-5 lg:p-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION - Làm gọn lại */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-7 bg-[#FF3399] rounded-full"></div>
            <h1 className="text-xl font-[900] text-[#2D3436] tracking-tight">
              Khóa học <span className="text-[#FF3399]">Của bạn</span>
            </h1>
          </div>
          <p className="text-[11px] text-[#B2BEC3] font-black ml-4 uppercase tracking-widest">
            {courses.length} Học phần
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B2BEC3]" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-60 bg-white border border-[#E5E5E5] rounded-xl pl-10 pr-4 py-2 text-[13px] focus:border-[#FF3399]/50 transition-all outline-none text-[#2D3436] font-bold"
            />
          </div>
          
          <button className="p-2 bg-white rounded-xl text-[#B2BEC3] border border-[#E5E5E5] hover:text-[#FF3399] transition-all">
            <Filter size={18} strokeWidth={2.5} />
          </button>
          
          <Link href="#">
            <button className="flex items-center gap-2 px-5 py-2 bg-[#FF3399] text-white text-[13px] font-[900] rounded-xl border-b-4 border-[#D12A7E] active:translate-y-0.5 active:border-b-0 transition-all">
              <Plus size={18} strokeWidth={4} />
              <span className="hidden sm:inline italic">TẠO MỚI</span>
            </button>
          </Link>
        </div>
      </header>

      {/* COURSE GRID - Tăng số cột và giảm khoảng cách thẻ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {courses.map((course) => (
          <div 
            key={course.id} 
            className="group bg-white p-5 rounded-[24px] border border-[#F0F0F0] border-b-[4px] hover:border-[#FF3399]/20 transition-all flex flex-col relative"
          >
            {/* Header Card nhỏ gọn */}
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black px-2 py-1 bg-[#F7F9FB] text-[#B2BEC3] rounded-md border border-[#F0F0F0]">
                {course.id}
              </span>
              <BookOpen size={16} className="text-[#E5E5E5] group-hover:text-[#FF3399] transition-colors" />
            </div>

            {/* Title - Thu nhỏ font (text-[15px]) */}
            <h3 className="text-[15px] font-[800] text-[#2D3436] mb-5 leading-snug min-h-[42px] line-clamp-2">
              {course.title}
            </h3>

            {/* Meta Data & Tags */}
            <div className="mt-auto flex flex-col gap-4">
              <div className="flex flex-wrap gap-1.5">
                {course.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-[#F7F9FB] text-[#636E72] text-[9px] font-black uppercase tracking-tighter rounded-md border border-[#F0F0F0]">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Info Line - Sát lại hơn */}
              <div className="flex items-center justify-between text-[11px] font-bold text-[#B2BEC3] pt-4 border-t border-[#F0F0F0]">
                <div className="flex items-center gap-1.5">
                  <User size={12} className="text-[#00CEC9]" />
                  <span className="truncate max-w-[80px]">{course.creator}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>{course.time}</span>
                </div>
              </div>
            </div>

            {/* Nút Chevron nhỏ ở góc */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
               <ChevronRight size={14} className="text-[#FF3399]" strokeWidth={3} />
            </div>
          </div>
        ))}

        {/* Create Card Placeholder - Làm thấp lại */}
        <div className="border-2 border-dashed border-[#E5E5E5] rounded-[24px] p-5 flex flex-col items-center justify-center gap-3 hover:bg-white hover:border-[#FF3399]/40 transition-all cursor-pointer group min-h-[180px]">
            <div className="w-10 h-10 bg-[#F7F9FB] rounded-full flex items-center justify-center group-hover:bg-[#FFF0F7] transition-all">
                <Plus size={24} className="text-[#B2BEC3] group-hover:text-[#FF3399]" />
            </div>
            <span className="text-[12px] font-[900] text-[#B2BEC3] group-hover:text-[#FF3399] uppercase tracking-widest">Thêm mới</span>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #EEE; 
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
"use client";

import React from "react";
import { UploadCloud, BrainCircuit, Pen, ChevronRight } from "lucide-react";
import Link from "next/link";

interface CourseActionCardsProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  triggerFileInput: () => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function CourseActionCards({
  fileInputRef,
  triggerFileInput,
  handleFileUpload,
}: CourseActionCardsProps) {
  return (
    <div className="grid grid-cols-12 gap-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload}
      />
      
      {/* Card 1: Upload */}
      <div className="col-span-12 lg:col-span-4 bg-white border-2 border-[#E5E5E5] p-6 rounded-[32px] shadow-[0_8px_0_0_#E5E5E5] hover:translate-y-[-2px] hover:shadow-[0_10px_0_0_#E5E5E5] transition-all flex flex-col">
        <div className="w-14 h-14 bg-[#1CB0F6] rounded-2xl flex items-center justify-center text-white shadow-[0_5px_0_0_#1899D6] mb-6">
          <UploadCloud size={28} strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-[900] mb-2 uppercase tracking-tight">Tải file lên</h3>
        <p className="text-[#777777] font-bold mb-8 text-xs flex-1">AI sẽ đọc kiến thức từ các tệp tin của bạn.</p>
        <button 
          onClick={triggerFileInput}
          className="w-full py-3 bg-[#1CB0F6] text-white border-b-6 border-[#1899D6] rounded-xl font-[900] uppercase text-sm flex items-center justify-center gap-2 hover:brightness-105 active:translate-y-[4px] active:border-b-2 transition-all">
          CHỌN TÀI LIỆU <ChevronRight size={16} strokeWidth={3} />
        </button>
      </div>

      {/* Card 2: Quiz */}
      <div className="col-span-12 lg:col-span-4 bg-white border-2 border-[#E5E5E5] p-6 rounded-[32px] shadow-[0_8px_0_0_#E5E5E5] hover:translate-y-[-2px] hover:shadow-[0_10px_0_0_#E5E5E5] transition-all flex flex-col">
        <div className="w-14 h-14 bg-[#00CEC9] rounded-2xl flex items-center justify-center text-white shadow-[0_5px_0_0_#00B5B1] mb-6">
          <BrainCircuit size={28} strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-[900] mb-2 uppercase tracking-tight">Tạo trắc nghiệm</h3>
        <p className="text-[#777777] font-bold mb-8 text-xs flex-1">Tạo bộ câu hỏi đánh giá năng lực nhanh chóng.</p>
        <Link href="/dashboard/courses/create/quiz">
          <button className="w-full py-3 bg-[#00CEC9] text-white border-b-6 border-[#00B5B1] rounded-xl font-[900] uppercase text-sm flex items-center justify-center gap-2 hover:brightness-105 active:translate-y-[4px] active:border-b-2 transition-all">
            BẮT ĐẦU <ChevronRight size={16} strokeWidth={3} />
          </button>
        </Link>
      </div>

      {/* Card 3: Editor */}
      <div className="col-span-12 lg:col-span-4 bg-white border-2 border-[#E5E5E5] p-6 rounded-[32px] shadow-[0_8px_0_0_#E5E5E5] hover:translate-y-[-2px] hover:shadow-[0_10px_0_0_#E5E5E5] transition-all flex flex-col">
        <div className="w-14 h-14 bg-[#FF3399] rounded-2xl flex items-center justify-center text-white shadow-[0_5px_0_0_#D12A7E] mb-6">
          <Pen size={26} strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-[900] mb-2 uppercase tracking-tight">Viết nội dung</h3>
        <p className="text-[#777777] font-bold mb-8 text-xs flex-1">Tự soạn thảo kiến thức trực tiếp trong trình duyệt.</p>
        <Link href="/simple">
          <button className="w-full py-3 bg-[#FF3399] text-white border-b-6 border-[#D12A7E] rounded-xl font-[900] uppercase text-sm flex items-center justify-center gap-2 hover:brightness-110 active:translate-y-[4px] active:border-b-2 transition-all">
            MỞ EDITOR <ChevronRight size={16} strokeWidth={3} />
          </button>
        </Link>
      </div>
    </div>
  );
}
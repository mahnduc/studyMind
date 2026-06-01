"use client";

import React from "react";
import { UploadCloud, Pen, ChevronRight, Lock, Sparkles, Plus } from "lucide-react";
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
    <div className="grid grid-cols-12 gap-6 w-full">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload}
      />
      
      <div className="col-span-12 md:col-span-6 bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
        <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 mb-6">
          <UploadCloud size={24} strokeWidth={2} />
        </div>
        <h3 className="text-lg font-bold mb-2 text-gray-800 tracking-tight">Tải file lên</h3>
        <p className="text-gray-500 font-medium mb-8 text-sm flex-1">
          AI sẽ đọc kiến thức từ các tệp tin của bạn.
        </p>
        <button 
          onClick={triggerFileInput}
          className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          Chọn tài liệu <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="col-span-12 md:col-span-6 border-2 border-dashed border-gray-200 p-6 rounded-3xl flex flex-col justify-center items-center text-center min-h-70 bg-gray-50/30">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 mb-4 select-none">
          <Plus size={20} strokeWidth={2} />
        </div>
        
        <h3 className="text-sm font-bold text-gray-400 tracking-tight mb-1 select-none">
          Trống
        </h3>
        
        <p className="text-gray-400/70 font-medium text-xs max-w-50 select-none">
          Không gian chờ thiết lập cấu hình hoặc tiện ích mở rộng.
        </p>
      </div>
    </div>
  );
}
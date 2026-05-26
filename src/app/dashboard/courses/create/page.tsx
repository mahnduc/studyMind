"use client";

import React from "react";
import { FileCode, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { useCreateCourse } from "./_hooks/useCreateCourse";
import { CourseActionCards } from "./_components/CourseActionCards"; 

export default function CreateCourse() {
  const {
    files,
    loading,
    isIngesting,
    selectedFile,
    fileInputRef,
    triggerFileInput,
    handleFileUpload,
    handleSelectFile,
    deleteFile,
    handleConfirmIngestion,
  } = useCreateCourse();

  return (
    <div className="w-full min-h-screen bg-[#F7F9FB] font-nunito text-[#4B4B4B]">
      <main className="p-6 lg:p-10">
        <div className="max-w-[1200px] mx-auto pb-20">
          
          <div className="flex flex-col gap-10">
            <CourseActionCards 
              fileInputRef={fileInputRef}
              triggerFileInput={triggerFileInput}
              handleFileUpload={handleFileUpload}
            />

            {/* Giữ lại nguyên vẹn File List Section tại đây */}
            <div className="col-span-12 mt-4 flex flex-col gap-6">
              <div className="bg-white border-2 border-[#E5E5E5] rounded-[32px] shadow-[0_8px_0_0_#E5E5E5] overflow-hidden">
                <div className="px-8 py-5 bg-[#F7F7F7] border-b-2 border-[#E5E5E5]">
                  <span className="text-xs font-[900] text-[#AFAFAF] uppercase tracking-[0.2em]">Thư viện tài liệu (OPFS)</span>
                </div>
                <div className="p-6 space-y-4">
                  {files.length === 0 && !loading && (
                    <div className="text-center py-8 text-[#AFAFAF] font-bold">Chưa có tài liệu nào trong workspace.</div>
                  )}
                  
                  {files.map((file) => (
                    <div
                      key={file.name}
                      onClick={() => handleSelectFile(file.name)}
                      className={`flex items-center p-5 rounded-2xl border-2 transition-all cursor-pointer
                        ${selectedFile === file.name 
                          ? 'bg-[#DDF4FF] border-[#84D8FF] shadow-[0_4px_0_0_#84D8FF]' 
                          : 'bg-white border-[#E5E5E5] hover:bg-[#F7F7F7]'}
                        ${isIngesting ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-5 ${selectedFile === file.name ? 'bg-[#1CB0F6] text-white' : 'bg-[#E5E5E5] text-[#AFAFAF]'}`}>
                        <FileCode size={22} />
                      </div>
                      <div className="flex-1">
                        <div className="font-[900] text-sm">{file.name}</div>
                        <div className="text-[10px] font-black text-[#AFAFAF] uppercase tracking-tighter">Sẵn sàng</div>
                      </div>
                      <div className="flex items-center gap-3">
                         {selectedFile === file.name && <CheckCircle2 size={24} className="text-[#1CB0F6]" strokeWidth={3} />}
                         <button 
                           disabled={isIngesting}
                           onClick={(e) => deleteFile(file.name, e)}
                           className="p-2 text-[#AFAFAF] hover:text-[#FF4B4B] transition-colors disabled:pointer-events-none"
                         >
                           <Trash2 size={18} />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                disabled={!selectedFile || isIngesting}
                onClick={handleConfirmIngestion}
                className={`w-full py-5 rounded-2xl font-[900] uppercase tracking-widest text-lg transition-all border-b-8 active:translate-y-[4px] active:border-b-0 flex items-center justify-center gap-3
                  ${selectedFile && !isIngesting
                    ? "bg-[#58CC02] border-[#46A302] text-white hover:brightness-110" 
                    : "bg-[#E5E5E5] border-[#AFAFAF] text-[#AFAFAF] cursor-not-allowed"}
                `}
              >
                {isIngesting ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    ĐANG XỬ LÝ...
                  </>
                ) : (
                  "XÁC NHẬN"
                )}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
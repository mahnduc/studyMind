"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  UploadCloud, 
  Pen, 
  ChevronRight, 
  FileCode, 
  CheckCircle2, 
  Trash2,
  BrainCircuit,
  Loader2 
} from "lucide-react";

import { ingestFromPath } from "@/app/dashboard/chatbot/_lib/rag/api";

export default function CreateCourse() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [files, setFiles] = useState<{ name: string; handle: FileSystemFileHandle }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFilesFromOPFS = async () => {
    setLoading(true);
    try {
      const root = await navigator.storage.getDirectory();
      const workspaceHandle = await root.getDirectoryHandle("my-workspace", { create: true });
      
      const fileList: { name: string; handle: FileSystemFileHandle }[] = [];

      for await (const entry of workspaceHandle.values()) {
        if (entry.kind === "file") {
          fileList.push({ name: entry.name, handle: entry as FileSystemFileHandle });
        }
      }
      setFiles(fileList);
    } catch (error) {
      console.error("Lỗi khi truy cập OPFS:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilesFromOPFS();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const root = await navigator.storage.getDirectory();
      const workspaceHandle = await root.getDirectoryHandle("my-workspace", { create: true });
      const fileHandle = await workspaceHandle.getFileHandle(file.name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();

      await loadFilesFromOPFS();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Lỗi upload:", error);
    }
  };

  const deleteFile = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Xóa file ${name}?`)) return;
    try {
      const root = await navigator.storage.getDirectory();
      const workspaceHandle = await root.getDirectoryHandle("my-workspace");
      await workspaceHandle.removeEntry(name);
      if (selectedFile === name) setSelectedFile(null);
      await loadFilesFromOPFS();
    } catch (error) {
      console.error("Lỗi xóa file:", error);
    }
  };

  const handleConfirmIngestion = async () => {
    if (!selectedFile) return;

    setIsIngesting(true);
    try {
      const filePath = `my-workspace/${selectedFile}`;
      
      const response = await ingestFromPath(filePath);

      if (response.success) {
        alert(response.message);
      } else {
        alert("Lỗi: " + response.error);
      }
      
    } catch (error: any) {
      alert("Lỗi: " + (error?.message || "Không thể xử lý dữ liệu."));
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F7F9FB] font-nunito text-[#4B4B4B]">
      <main className="p-6 lg:p-10">
        <div className="max-w-[1200px] mx-auto pb-20">
          
          <div className="flex flex-col gap-10">
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
                  onClick={() => fileInputRef.current?.click()}
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
                <button className="w-full py-3 bg-[#00CEC9] text-white border-b-6 border-[#00B5B1] rounded-xl font-[900] uppercase text-sm flex items-center justify-center gap-2 hover:brightness-105 active:translate-y-[4px] active:border-b-2 transition-all">
                  BẮT ĐẦU <ChevronRight size={16} strokeWidth={3} />
                </button>
              </div>

              {/* Card 3: Editor */}
              <div className="col-span-12 lg:col-span-4 bg-white border-2 border-[#E5E5E5] p-6 rounded-[32px] shadow-[0_8px_0_0_#E5E5E5] hover:translate-y-[-2px] hover:shadow-[0_10px_0_0_#E5E5E5] transition-all flex flex-col">
                <div className="w-14 h-14 bg-[#FF3399] rounded-2xl flex items-center justify-center text-white shadow-[0_5px_0_0_#D12A7E] mb-6">
                  <Pen size={26} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-[900] mb-2 uppercase tracking-tight">Viết nội dung</h3>
                <p className="text-[#777777] font-bold mb-8 text-xs flex-1">Tự soạn thảo kiến thức trực tiếp trong trình duyệt.</p>
                <button className="w-full py-3 bg-[#FF3399] text-white border-b-6 border-[#D12A7E] rounded-xl font-[900] uppercase text-sm flex items-center justify-center gap-2 hover:brightness-110 active:translate-y-[4px] active:border-b-2 transition-all">
                  MỞ EDITOR <ChevronRight size={16} strokeWidth={3} />
                </button>
              </div>

              {/* File List Section */}
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
                        onClick={() => !isIngesting && setSelectedFile(selectedFile === file.name ? null : file.name)}
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

        </div>
      </main>
    </div>
  );
}
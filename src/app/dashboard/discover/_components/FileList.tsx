"use client";

import React from "react";
import { FileCode, CheckCircle2, Trash2, Loader2 } from "lucide-react";

interface FileItem {
  name: string;
}

interface FileListProps {
  files: FileItem[];
  loading: boolean;
  selectedFile: string | null;
  isIngesting: boolean;
  isPending: boolean;
  handleSelectFile: (name: string) => void;
  deleteFile: (name: string, e: React.MouseEvent) => void;
}

export function FileList({
  files,
  loading,
  selectedFile,
  isIngesting,
  isPending,
  handleSelectFile,
  deleteFile,
}: FileListProps) {
  return (
    <div className="w-full bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden transition-all">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Tài liệu của bạn
        </span>
      </div>

      <div className="p-6 space-y-3">
        {files.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400 font-medium text-sm">
            Chưa có tài liệu nào trong workspace của bạn.
          </div>
        )}

        {files.map((file) => {
          const isSelected = selectedFile === file.name;
          const isThisFileIngesting = isSelected && isIngesting;
          
          return (
            <div
              key={file.name}
              onClick={() => !isPending && handleSelectFile(file.name)}
              className={`group flex items-center p-4 rounded-2xl border transition-all duration-300
                ${isSelected 
                  ? isThisFileIngesting
                    ? 'bg-amber-50/40 border-amber-200 shadow-sm animate-pulse' 
                    : 'bg-sky-50/60 border-sky-200 shadow-sm' 
                  : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'}
                ${isPending && !isSelected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 transition-all duration-300
                ${isSelected 
                  ? isThisFileIngesting 
                    ? 'bg-amber-500 text-white animate-spin-slow' 
                    : 'bg-sky-500 text-white' 
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}
              >
                {isThisFileIngesting ? (
                  <Loader2 className="animate-spin text-white" size={20} />
                ) : (
                  <FileCode size={20} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800 truncate">{file.name}</div>
                <div className={`text-[11px] font-bold mt-0.5 transition-colors duration-300
                  ${isThisFileIngesting ? 'text-amber-600' : 'text-gray-400'}`}
                >
                  {isThisFileIngesting ? "Đang nạp bộ dữ liệu..." : "Sẵn sàng xử lý"}
                </div>
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {isSelected && !isIngesting && (
                  <CheckCircle2 size={20} className="text-emerald-500 animate-scale-in" strokeWidth={2.5} />
                )}
                <button 
                  disabled={isPending}
                  onClick={(e) => deleteFile(file.name, e)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-0 disabled:pointer-events-none"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
"use client";

import React from "react";
import { X, Database } from "lucide-react";

interface KnowledgeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeBases: string[];
  selectedKB: string | null;
  setSelectedKB: (kb: string) => void;
  loading: boolean;
//   selectedModel: string;
//   setSelectedModel: (model: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  showKey: boolean;
  setShowKey: (show: boolean) => void;
}

export default function KnowledgeSidebar({
  isOpen,
  onClose,
  knowledgeBases,
  selectedKB,
  setSelectedKB,
  loading,
}: KnowledgeSidebarProps) {
  return (
    <>
      {/* Backdrop mờ khi mở trên Mobile / Tablet */}
      {isOpen && (
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`absolute lg:static inset-y-0 left-0 w-72 border-r border-[#F0F0F0] bg-white flex flex-col h-full shrink-0 z-40 transition-all duration-300 ease-in-out ${
          isOpen
            ? "translate-x-0 opacity-100 animate-none"
            : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 lg:opacity-0 overflow-hidden"
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#F0F0F0] flex items-center justify-between shrink-0 bg-gradient-to-r from-[#FFF0F7] to-white">
          <div className="flex items-center gap-2.5">
            <div>
              <h2 className="text-[11px] font-black text-[#2D3436] tracking-wider uppercase leading-none">
                Cơ sở tri thức
              </h2>
              <p className="text-[9px] text-[#B2BEC3] font-semibold mt-0.5">OPFS Storage</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#B2BEC3] hover:bg-[#F7F9FB] hover:text-[#2D3436] transition-colors"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* KB List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {knowledgeBases.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-3 text-center py-10 px-4 rounded-2xl bg-[#F7F9FB] border-2 border-dashed border-[#EBEBEB]">
              <div className="w-10 h-10 rounded-xl bg-[#F0F0F0] flex items-center justify-center">
                <Database size={18} className="text-[#B2BEC3]" />
              </div>
              <p className="text-xs text-[#B2BEC3] font-bold italic leading-relaxed">
                Chưa nạp nguồn<br />tri thức nội bộ
              </p>
            </div>
          ) : (
            knowledgeBases.map((kb) => {
              const isSelected = selectedKB === kb;
              return (
                <button
                    key={kb}
                    type="button"
                    disabled={loading}
                    onClick={() => setSelectedKB(kb)}
                    className={`w-full text-left pl-6 pr-3.5 py-3 rounded-xl transition-all flex items-center gap-3 group disabled:opacity-50 border-0 ${
                        isSelected
                        ? "bg-[#FFF5FA] text-[#FF3399]"
                        : "bg-transparent text-[#2D3436] hover:bg-[#F7F9FB]"
                    }`}
                    >
                    <span className="truncate text-[13px] font-bold flex-1">{kb}</span>
                </button>
              );
            })
          )}
        </div>

        
      </aside>
    </>
  );
}
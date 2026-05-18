"use client";

import { Menu, Camera } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

interface ControlPanelProps {
  knowledgeBases: string[];
  selectedKB: string;
  setSelectedKB: (kb: string) => void;
  isLoading: boolean;
  error: string | null;
  hasNodes: boolean;       // Thêm prop kiểm tra sơ đồ có dữ liệu không
  isExporting: boolean;    // Thêm prop trạng thái xuất file
  onExport: () => void;    // Thêm prop hàm hành động xuất file
}

export default function ControlPanel({
  knowledgeBases,
  selectedKB,
  setSelectedKB,
  isLoading,
  error,
  hasNodes,
  isExporting,
  onExport,
}: ControlPanelProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const currentPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    // Ngăn kéo thả khi tương tác với select hoặc nút bấm xuất file
    if (
      target.tagName.toLowerCase() === "select" || 
      target.tagName.toLowerCase() === "option" ||
      target.closest(".btn-export")
    ) {
      return;
    }

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - currentPosRef.current.x,
      y: e.clientY - currentPosRef.current.y,
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const targetX = e.clientX - dragStartRef.current.x;
      const targetY = e.clientY - dragStartRef.current.y;

      currentPosRef.current = { x: targetX, y: targetY };

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          setPosition({ x: currentPosRef.current.x, y: currentPosRef.current.y });
          rafRef.current = null;
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isDragging]);

  return (
    <div
      style={{
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        willChange: "transform",
      }}
      className={`absolute top-1/2 left-1/2 z-30 ${
        isDragging ? "transition-none" : "transition-transform duration-200 ease-out"
      }`}
    >
      <div
        onMouseDown={handleMouseDown}
        className={`bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 shadow-xl flex items-center gap-2.5 select-none transition-all ${
          isDragging ? "cursor-grabbing border-indigo-500 scale-102" : "cursor-grab hover:bg-slate-800"
        }`}
        title="Nhấn giữ các khoảng trống trên thanh để kéo di chuyển"
      >
        {/* ICON MENU GỐC */}
        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          <Menu size={14} />
          {isLoading && <span className="animate-spin text-xs text-indigo-400">⏳</span>}
        </div>

        {/* THÀNH PHẦN SELECT CHỌN BỘ TRI THỨC */}
        {knowledgeBases.length === 0 ? (
          <span className="text-[11px] text-amber-400 font-medium px-1">Trống</span>
        ) : (
          <select
            value={selectedKB}
            disabled={isLoading}
            onChange={(e) => setSelectedKB(e.target.value)}
            className="text-[11px] rounded-md border-0 bg-slate-800 text-slate-200 py-0.5 pl-2 pr-6 shadow-sm focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer max-w-[140px] truncate"
          >
            {knowledgeBases.map((kb) => (
              <option key={kb} value={kb} className="bg-slate-900 text-slate-200">
                {kb}
              </option>
            ))}
          </select>
        )}

        {/* NÚT BẤM XUẤT FILE ẢNH (CHỈ HIỂN THỊ KHI CÓ NODE VÀ KHÔNG TRỐNG) */}
        {hasNodes && (
          <div className="border-l border-slate-700 pl-2 shrink-0 flex items-center">
            <button
              onClick={onExport}
              disabled={isExporting}
              className={`btn-export px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all flex items-center gap-1 cursor-pointer ${
                isExporting
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 active:scale-95 black shadow-md shadow-indigo-900/20"
              }`}
              title="Xuất cấu trúc mindmap hiện tại thành file ảnh PNG chất lượng cao"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-3 w-3 text-slate-800" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Camera size={12} className="opacity-90" />
                  <span>EXPORT PNG</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* THÔNG BÁO LỖI */}
        {error && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-red-500 text-white text-[9px] rounded-md font-medium max-w-[180px] truncate shadow-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
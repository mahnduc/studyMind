"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown"; // Import thư viện render markdown

interface DetailWindowProps {
  chunk: { id: string; content: string };
  onClose: () => void;
}

export default function DetailWindow({ chunk, onClose }: DetailWindowProps) {
  const [position, setPosition] = useState({ x: 250, y: -180 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const currentPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Chỉ xử lý chuột trái

    const target = e.target as HTMLElement;

    // KIỂM TRA CHÍNH XÁC: Nếu click trúng nút close hoặc vùng nội dung thì dừng kéo
    if (
      target.closest(".btn-close") || 
      target.closest(".content-area")
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
      onMouseDown={handleMouseDown}
      className={`absolute top-1/2 left-1/2 w-80 sm:w-[450px] h-[480px] bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border flex flex-col p-4 z-40 select-none transition-all ${
        isDragging 
          ? "transition-none cursor-grabbing border-indigo-500 scale-[1.01]" 
          : "transition-transform duration-200 ease-out cursor-grab hover:border-slate-300"
      }`}
      title="Nhấn giữ bất kỳ vùng trống nào để di chuyển cửa sổ"
    >
      {/* THANH TIÊU ĐỀ */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Nội dung chi tiết</span>
          <span className="text-xs font-semibold text-slate-700 truncate font-mono mt-0.5">{chunk.id}</span>
        </div>
        
        {/* NÚT ĐÓNG CỬA SỔ */}
        <button
          onClick={onClose}
          className="btn-close text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          title="Đóng cửa sổ"
        >
          ✕
        </button>
      </div>

      {/* VÙNG NỘI DUNG HIỂN THỊ ĐÃ TÍCH HỢP RENDER MARKDOWN */}
      <div className="content-area overflow-y-auto flex-1 text-xs text-slate-700 bg-slate-50/70 p-4 rounded-lg border border-slate-100 font-sans select-text cursor-auto leading-relaxed">
        <div className="markdown-body entry-content">
          <ReactMarkdown
            components={{
              // Tùy biến lại CSS nhỏ cho các thẻ markdown hiển thị đồng bộ gọn gàng
              h1: ({node, ...props}) => <h1 className="text-base font-bold text-slate-900 mt-2 mb-1 border-b pb-0.5" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-sm font-bold text-slate-800 mt-2 mb-1" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xs font-bold text-slate-800 mt-1.5 mb-0.5" {...props} />,
              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
              li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
              code: ({node, ...props}) => <code className="bg-slate-200/80 px-1 py-0.5 rounded font-mono text-[11px] text-pink-600" {...props} />,
              pre: ({node, ...props}) => <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-md font-mono text-[11px] my-2 overflow-x-auto whitespace-pre" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 pl-2 italic text-slate-500 my-2" {...props} />,
            }}
          >
            {chunk.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
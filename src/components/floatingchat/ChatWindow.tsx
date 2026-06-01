'use client';

import React from 'react';
import { X, TrendingUpDown } from 'lucide-react';
import { Resizable } from 're-resizable'; // Import thư viện
import ContentWindow from './ContentWindow';

interface ChatWindowProps {
  onClose: () => void;
}

export default function ChatWindow({ onClose }: ChatWindowProps) {
  return (
    <Resizable
      defaultSize={{
        width: 720,
        height: 450,
      }}
      minWidth={400}
      minHeight={300}
      maxWidth="95vw"
      maxHeight="90vh"
      enable={{
        top: false, right: true, bottom: true, left: false,
        topRight: false, bottomRight: true, bottomLeft: false, topLeft: false
      }}

      handleClasses={{
        right: 'cursor-e-resize',
        bottom: 'cursor-s-resize',
        bottomRight: 'cursor-se-resize'
      }}
    >
      <div className="w-full h-full bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800">
        <div className="drag-handle flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 shadow-sm cursor-grab active:cursor-grabbing select-none shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/50">
              <TrendingUpDown size={16} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold tracking-wide text-slate-800 truncate">
                Theo dõi
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); 
              onClose();
            }}
            className="group flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 active:scale-95"
            aria-label="Close"
          >
            <X size={16} className="transition-transform group-hover:rotate-90" />
          </button>
        </div>
        
        <div className="flex-1 bg-slate-50/60 overflow-auto custom-scrollbar">
          <ContentWindow />
        </div>
      </div>
    </Resizable>
  );
}
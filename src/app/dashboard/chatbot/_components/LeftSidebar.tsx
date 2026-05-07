'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  MessageSquare,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { deleteConversation, getConversations } from '../_service/db';

export interface Conversation {
  id: number;
  title: string;
  createdAt: string; 
}

interface LeftSidebarProps {
  currentConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onCreateConversation: () => void;
  refreshTrigger?: number;
}

export default function LeftSidebar({
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
  refreshTrigger = 0
}: LeftSidebarProps) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [leftOpen, refreshTrigger, loadConversations]);

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc muốn xóa hội thoại này?')) {
      try {
        await deleteConversation(id);
        await loadConversations();
        if (currentConversationId === id) onCreateConversation();
      } catch (error) {
        alert("Không thể xóa hội thoại");
      }
    }
  };

  return (
    <>
      {/* Nút Toggle Menu - Nằm absolute trong Main */}
      <button
        onClick={() => setLeftOpen(!leftOpen)}
        className="absolute top-6 left-6 z-30 p-2.5 bg-white border-2 border-b-4 border-[#E5E5E5] rounded-xl text-[#2D3436] hover:bg-[#F7F9FB] transition-all active:border-b-0 active:translate-y-1 shadow-sm"
      >
        {leftOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
      </button>

      {/* SIDEBAR CONTAINER - Dùng absolute để không thoát ra ngoài Main */}
      <aside
        className={`absolute top-0 left-0 h-full bg-white border-r-[1.5px] border-[#F0F0F0] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] w-72 z-20 rounded-l-[24px] overflow-hidden
        ${leftOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-6 pt-20">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-extrabold text-[#B2BEC3] uppercase text-[11px] tracking-widest">Lịch sử</h3>
            <span className="bg-[#F0F0F0] text-[#B2BEC3] text-[10px] px-2 py-0.5 rounded-full font-bold">
              {conversations.length}
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
            {loading && conversations.length === 0 ? (
              <div className="text-center py-4 animate-pulse text-[#B2BEC3] text-[10px] font-bold">LOADING...</div>
            ) : conversations.length === 0 ? (
              <div className="text-[13px] text-[#B2BEC3] font-bold py-10 text-center border-2 border-dashed border-[#F7F9FB] rounded-2xl">
                Trống
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = currentConversationId === conv.id;
                return (
                  <div
                    key={conv.id}
                    className={`group relative p-3 rounded-xl border-2 border-b-4 transition-all cursor-pointer active:scale-[0.97] 
                      ${isActive ? 'bg-[#FFF0F7] border-[#FF3399] text-[#FF3399]' : 'bg-white border-[#F0F0F0] hover:bg-[#F7F9FB] text-[#2D3436]'}`}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      if (window.innerWidth < 768) setLeftOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare size={16} className="shrink-0" />
                      <div className="flex-1 truncate font-bold text-[13px]">{conv.title || 'Chat'}</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => { onCreateConversation(); setLeftOpen(false); }}
            className="mt-4 w-full py-3 bg-[#FF3399] text-white font-extrabold rounded-xl border-b-4 border-[#D42B7D] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wide"
          >
            <Sparkles size={16} fill="currentColor" /> Chat mới
          </button>
        </div>
      </aside>

      {/* Lớp phủ (Overlay) bên trong Main */}
      {leftOpen && (
        <div
          className="absolute inset-0 bg-[#2D3436]/5 z-10 backdrop-blur-[1px] rounded-[24px] transition-opacity"
          onClick={() => setLeftOpen(false)}
        />
      )}
    </>
  );
}
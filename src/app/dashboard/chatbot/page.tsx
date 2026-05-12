'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Send } from 'lucide-react';
// Components
import { ChatMessage } from './_components/ChatMessage';
// Hooks
import { useMessages } from './_hooks/useMessages';
import { useChatScroll } from './_hooks/useChatScroll';
// Services & Utils
import { createUiMessage } from './_service/message.factory';
import { getDB } from './_service/db';
import { catchError } from '@/lib/error/error';
import { sendChatMessage } from './_service/chat.service';
import { loadConversation } from './_service/conversation.service';

const LeftSidebar = dynamic(() => import('./_components/LeftSidebar'), {
  ssr: false,
  loading: () => <div className="w-70 shrink-0" />,
});

export default function ChatPage() {
  // --- State & Hooks ---
  const { messages, setMessages, appendMessage, clearMessages } = useMessages();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);

  const scrollRef = useChatScroll([messages, isLoading]);

  // --- Effects ---
  useEffect(() => {
    catchError(getDB());
  }, []);

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = overrideText ?? input.trim();
      if (!text || isLoading) return;
      // Hiển thị ngay tin nhắn người dùng
      appendMessage(createUiMessage('user', text, chatId ?? 0));
      // Reset input
      if (!overrideText) setInput('');

      setIsLoading(true);

      // Gửi tin nhắn và nhận phản hồi
      const [error, result] = await catchError(
        sendChatMessage(text, chatId, messages)
      );

      setIsLoading(false);

      // Xử lý lỗi
      if (error || !result) {
        appendMessage(
          createUiMessage(
            'assistant',
            `Lỗi: ${error?.message ?? 'AI không thể trả lời'}`,
            chatId ?? 0
          )
        );
        return;
      }
      // Cập nhật trạng thái nếu là hội thoại mới
      if (result.isNewConversation) {
        setChatId(result.activeConversationId);
        setSidebarRefresh((prev) => prev + 1);
      }
      // Hiển thị phản hồi của AI
      appendMessage(result.assistantMessage);
    },
    [input, isLoading, chatId, messages, appendMessage]
  );

  const handleSelectConversation = useCallback(
    async (id: number) => {
      const [error, history] = await catchError(loadConversation(id));
      if (error || !history) return;

      setChatId(id);
      setMessages(history);
    },
    [setMessages]
  );

  const handleCreateConversation = useCallback(() => {
    setChatId(null);
    clearMessages();
  }, [clearMessages]);

  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="text-center text-gray-400 mt-20">
          <p className="text-xl font-bold">Bắt đầu một cuộc trò chuyện mới</p>
          <p className="text-sm">Lịch sử được lưu tại trình duyệt của bạn.</p>
        </div>
      );
    }

    return (
      <>
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onAction={handleSend}/>
        ))}
        {isLoading && (
          <ChatMessage
            message={{
              id: -1,
              role: 'assistant',
              content: '...',
              conversationId: chatId ?? 0,
              createdAt: '',
            }}
          />
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-white text-[#2D3436]">
      <LeftSidebar
        currentConversationId={chatId}
        onSelectConversation={handleSelectConversation}
        onCreateConversation={handleCreateConversation}
        refreshTrigger={sidebarRefresh}
      />

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth custom-scrollbar"
      >
        <div className="max-w-4xl mx-auto w-full pt-16">
          {renderMessages()}
        </div>
      </main>

      <footer className="bg-white pt-2 pb-6 px-4 md:px-8 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-2 bg-white border-2 border-[#E5E5E5] border-b-4 rounded-3xl p-2 focus-within:border-[#1CB0F6] transition-all shadow-sm">
            <textarea
              rows={1}
              value={input}
              placeholder="Nhập tin nhắn..."
              disabled={isLoading}
              className="focus:outline-none flex-1 bg-transparent border-none focus:ring-0 text-[15px] font-bold py-3 resize-none max-h-32 placeholder-[#B2BEC3] text-[#2D3436] pl-3"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-3 bg-[#1CB0F6] text-white rounded-xl border-b-4 border-[#1899D6] hover:brightness-105 active:translate-y-1 active:border-b-0 disabled:opacity-30 transition-all"
            >
              <Send size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
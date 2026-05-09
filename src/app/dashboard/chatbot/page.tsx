'use client';

import React, { useState, useRef, useEffect, useCallback, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { Send } from 'lucide-react';
import { ChatMessage } from './_components/ChatMessage';
import { Message } from './_service/message';
import { callGroqChat } from './_service/groq';
import { keyApi } from '../settings/api-key/_api/key.api';
import { getChatHistory, getDB, saveMessage } from './_service/db';
import { catchError } from '@/lib/error/error';
import { SYSTEM_PROMPT } from './prompt/system';

const LeftSidebar = dynamic(() => import('./_components/LeftSidebar'), {
  ssr: false,
  loading: () => <div className="w-70 shrink-0" />,
});

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const [, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    catchError(getDB());
  }, []);

  // Tự động scroll xuống cuối mỗi khi có tin nhắn mới hoặc đang load
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [messages, isLoading]);

  const updateMessages = (msg: Message) => startTransition(() => setMessages(prev => [...prev, msg]));

  /**
   * handleSend chấp nhận một tham số text tùy chọn để có thể kích hoạt từ các nút bấm/thẻ Card (CapabilitiesList)
   */
  const handleSend = useCallback(async (overrideText?: string) => {
    const text = overrideText || input.trim();
    if (!text || isLoading) return;

    // 1. Cập nhật tin nhắn User lên UI ngay lập tức
    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: text,
      conversationId: chatId ?? 0,
      createdAt: new Date().toISOString()
    };

    updateMessages(userMsg);
    if (!overrideText) setInput('');
    setIsLoading(true);

    // 2. Chuẩn bị dữ liệu (Lưu tin nhắn và lấy API Key)
    const [errPrep, prepData] = await catchError(Promise.all([
      saveMessage(text, chatId, 'user'),
      keyApi.getRandomKey('groq')
    ]));

    if (errPrep || !prepData) {
      setIsLoading(false);
      const errMsg = `Lỗi: ${errPrep?.message || 'Không thể chuẩn bị dữ liệu'}`;
      updateMessages({
        id: Date.now() + 1,
        role: 'assistant',
        content: errMsg,
        conversationId: chatId ?? 0,
        createdAt: new Date().toISOString()
      });
      return;
    }

    const [saveRes, apiKey] = prepData;
    const activeId = saveRes.isNewConversation ? saveRes.conversationId : chatId;
    
    if (saveRes.isNewConversation) {
      setChatId(saveRes.conversationId);
      setSidebarRefresh(p => p + 1);
    }

    // 3. Xử lý ngữ cảnh (Sliding Window 8 tin nhắn gần nhất)
    const limitedHistory = messages.slice(-8); 
    const contextMessages = [SYSTEM_PROMPT, ...limitedHistory];

    // 4. Gọi API Groq kèm theo toolList
    // Đảm bảo hàm callGroqChat của bạn có nhận tham số toolList
    const [errChat, res] = await catchError(callGroqChat(apiKey, contextMessages, text));

    setIsLoading(false);

    if (errChat || !res || !res.ok) {
      updateMessages({
        id: Date.now() + 2,
        role: 'assistant',
        content: `Lỗi phản hồi: ${errChat?.message || 'AI không thể trả lời lúc này'}`,
        conversationId: activeId ?? 0,
        createdAt: new Date().toISOString()
      });
      return;
    }

    const choice = res.data?.choices?.[0];
    const aiMessage = choice?.message;
    let finalContent = aiMessage?.content || '';

    // 5. Logic Xử lý Tool Calling chuẩn hóa
    if (aiMessage?.tool_calls && aiMessage.tool_calls.length > 0) {
      const toolCall = aiMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};

      // Map tên Function từ AI sang Tag UI của Frontend
      switch (functionName) {
        case 'get_capabilities':
          finalContent = '[SHOW_CAPABILITIES_CMPT]';
          break;
        
        case 'bm25_search':
          // Lưu query vào nội dung hoặc một field ẩn nếu cần
          // Ở đây ta dùng tag để ChatMessage render KnowledgeBaseList
          finalContent = '[CALL_TOOL_BM25_SEARCH]';
          break;

        case 'show_chart':
          finalContent = '[SHOW_CHART_CMPT]';
          break;

        default:
          // Nếu AI gọi tool lạ, giữ nguyên nội dung hoặc fallback
          break;
      }
    }

    // Fallback nếu AI không trả về cả nội dung lẫn tool call
    if (!finalContent && !aiMessage?.tool_calls) {
      finalContent = 'Tôi không tìm thấy thông tin phù hợp, bạn có muốn thử lại không?';
    }

    // 6. Tạo tin nhắn Assistant hoàn chỉnh
    const assistantMsg: Message = {
      id: Date.now() + 3,
      role: 'assistant',
      content: finalContent,
      tool_calls: aiMessage?.tool_calls, // Quan trọng: Lưu lại để ChatMessage.tsx lấy tham số query
      conversationId: activeId ?? 0,
      createdAt: new Date().toISOString(),
      model: res.data.model
    };

    // 7. Cập nhật UI và Lưu vào database
    updateMessages(assistantMsg);
    
    // Lưu tin nhắn assistant vào DB (sử dụng requestIdleCallback để không chặn UI)
    requestIdleCallback(() => {
      catchError(saveMessage(finalContent, activeId, 'assistant'));
    });

  }, [input, isLoading, messages, chatId, updateMessages, setChatId, setSidebarRefresh]);

  const handleSelectConversation = useCallback(async (id: number) => {
    const [err, history] = await catchError(getChatHistory(id));
    if (err || !history) return;

    setChatId(id);
    startTransition(() => {
      setMessages(history.map(h => ({
        id: h.id,
        role: h.role as any,
        content: h.content,
        conversationId: h.conversation_id,
        createdAt: h.created_at
      })));
    });
  }, []);

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-white text-[#2D3436]">
      <LeftSidebar
        currentConversationId={chatId}
        onSelectConversation={handleSelectConversation}
        onCreateConversation={() => { setChatId(null); setMessages([]); }}
        refreshTrigger={sidebarRefresh}
      />

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth custom-scrollbar">
        <div className="max-w-4xl mx-auto w-full pt-16">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <p className="text-xl font-bold">Bắt đầu một cuộc trò chuyện mới</p>
              <p className="text-sm">Lịch sử được lưu tại trình duyệt của bạn.</p>
            </div>
          ) : (
            messages.map(m => (
              <ChatMessage 
                key={m.id} 
                message={m} 
                onAction={(text) => handleSend(text)} // Truyền hàm handleSend
              />
            ))
          )}

          {isLoading && (
            <ChatMessage 
              message={{
                id: -1,
                role: 'assistant',
                content: '...',
                conversationId: chatId ?? 0,
                createdAt: ''
              }} 
            />
          )}
        </div>
      </main>

      <footer className="bg-white pt-2 pb-6 px-4 md:px-8 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-2 bg-white border-2 border-[#E5E5E5] border-b-4 rounded-3xl p-2 focus-within:border-[#1CB0F6] transition-all shadow-sm">
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Nhập tin nhắn..."
              disabled={isLoading}
              className="focus:outline-none flex-1 bg-transparent border-none focus:ring-0 text-[15px] font-bold py-3 resize-none max-h-32 placeholder-[#B2BEC3] text-[#2D3436] pl-3"
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
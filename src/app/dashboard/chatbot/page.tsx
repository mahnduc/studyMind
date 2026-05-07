'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { toast } from 'react-toastify';
import { ChatMessage } from './_components/ChatMessage';
import { Message, createMessage } from './_service/message'; // Sử dụng service mới
import { callGroqChat } from './_service/groq';
import { keyApi } from '../settings/api-key/_api/key.api';
import { getChatHistory, getDB, saveMessage } from './_service/db';
import LeftSidebar from './_components/LeftSidebar';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // State để theo dõi ID cuộc hội thoại hiện tại
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Khởi tạo DB khi component mount
  useEffect(() => {
    const init = async () => {
      try {
        await getDB();
        setMounted(true);
      } catch (err) {
        toast.error("Lỗi khởi tạo cơ sở dữ liệu local.");
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // 1. Hiển thị tin nhắn người dùng lên UI (Dùng createMessage mới)
    const userMsgUI = createMessage('user', trimmedInput, {
      conversationId: currentConversationId ?? 0
    });
    
    setMessages(prev => [...prev, userMsgUI]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Lưu tin nhắn người dùng vào PGlite
      const saveRes = await saveMessage(trimmedInput, currentConversationId, "user");
      
      let activeConversationId = currentConversationId;
      if (saveRes.isNewConversation) {
        activeConversationId = saveRes.conversationId;
        setCurrentConversationId(saveRes.conversationId);
      }

      // 3. Lấy API Key và gọi LLM
      const apiKey = await keyApi.getRandomKey("groq");
      const result = await callGroqChat(apiKey, messages, trimmedInput);

      if (!result.ok) {
        throw new Error(result.data?.error?.message || 'Không thể nhận phản hồi từ AI.');
      }

      const aiContent = result.data.choices?.[0]?.message?.content || 'Không có phản hồi.';

      // 4. Lưu phản hồi của AI vào PGlite
      await saveMessage(aiContent, activeConversationId, "assistant");

      // 5. Cập nhật AI message lên UI (Dùng createMessage mới)
      const aiMsgUI = createMessage('assistant', aiContent, {
        conversationId: activeConversationId ?? 0,
        metadata: { model: result.data.model || 'groq-ai' }
      });

      setMessages(prev => [...prev, aiMsgUI]);

    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (id: number) => {
    const history = await getChatHistory(id);
    
    // Format lại lịch sử từ DB theo chuẩn Message Service
    const formattedMessages: Message[] = history.map(h => 
      createMessage(h.role, h.content, {
        id: h.id,
        conversationId: h.conversation_id,
        createdAt: h.created_at,
        type: 'markdown'
      })
    );
    
    setCurrentConversationId(id);
    setMessages(formattedMessages);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-white text-[#2D3436]">
      <LeftSidebar 
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onCreateConversation={() => {
          setCurrentConversationId(null);
          setMessages([]);
        }}
        refreshTrigger={messages.length} 
      />

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth custom-scrollbar"
      >
        <div className="max-w-4xl mx-auto w-full pt-16">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              <p className="text-xl font-bold">Bắt đầu một cuộc trò chuyện mới</p>
              <p className="text-sm">Lịch sử sẽ được lưu tự động vào trình duyệt của bạn.</p>
            </div>
          )}
          
          {messages.map(message => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading && (
            <ChatMessage
              message={createMessage('assistant', '', {
                id: -1,
                type: 'loading'
              })}
            />
          )}
        </div>
      </main>

      <footer className="bg-white pt-2 pb-6 px-4 md:px-8 shrink-0 border-t-2 border-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-2 bg-white border-2 border-[#E5E5E5] border-b-4 rounded-[24px] p-2 focus-within:border-[#1CB0F6] transition-all shadow-sm">
            <button className="p-3 text-[#B2BEC3] hover:text-[#1CB0F6] transition-colors">
              <Paperclip size={22} strokeWidth={2.5} />
            </button>

            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Nhập tin nhắn..."
              disabled={isLoading}
              className="focus:outline-none flex-1 bg-transparent border-none focus:ring-0 text-[15px] font-bold py-3 resize-none max-h-32 placeholder-[#B2BEC3] text-[#2D3436] leading-tight"
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3 bg-[#1CB0F6] text-white rounded-xl border-b-4 border-[#1899D6] hover:brightness-105 active:translate-y-1 active:border-b-0 disabled:opacity-30 disabled:border-b-0 transition-all shrink-0"
            >
              <Send size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AgentConfig, AgentSession, ChatMessage } from "@/agent/core/types";
import { groqChat } from "@/agent/core/orchestrator";

interface UseAgentChatProps {
  agent: AgentConfig;
  initialCollectedData?: Record<string, any>;
}

export function useAgentChat({ agent, initialCollectedData = {} }: UseAgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const sessionRef = useRef<AgentSession>({
    history: [],
    collectedData: initialCollectedData,
    state: {
      step: 0,
      maxSteps: agent.maxSteps || 10,
      isFinished: false,
    },
  });

  useEffect(() => {
    sessionRef.current.collectedData = {
      ...sessionRef.current.collectedData,
      ...initialCollectedData,
    };
  }, [initialCollectedData]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);

    // 1. Giả lập hiển thị tin nhắn của User trên UI trước cho mượt mà
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      // 2. CHỮA LỖI ĐÓNG BĂNG CHAT: Reset lại trạng thái engine trước khi gọi groqChat
      // Việc này giúp phá vỡ cờ `isFinished: true` cũ, cho phép vòng lặp while chạy tiếp lượt chat mới
      sessionRef.current.state.isFinished = false;
      sessionRef.current.state.step = 0;

      // 3. Kích hoạt core điều phối gốc
      await groqChat({
        message: text,
        agent,
        session: sessionRef.current,
      });

      // 4. CHỮA LỖI PHẢN HỒI DƯ THỪA TRỐNG:
      // Lọc bỏ các tin nhắn của assistant có content rỗng (chỉ đóng vai trò trigger tool_calls)
      // Điều này giúp UI chỉ hiển thị tin nhắn user, tool kết quả (nếu muốn) và câu trả lời chữ cuối cùng.
      const cleanHistory = sessionRef.current.history.filter((msg) => {
        // Nếu là tin nhắn của trợ lý nhưng không có chữ gì thì loại bỏ khỏi UI
        if (msg.role === "assistant" && !msg.content?.trim()) {
          return false;
        }
        return true;
      });

      // Cập nhật mảng sạch lên giao diện
      setMessages(cleanHistory);

    } catch (error) {
      console.error("Lỗi hệ thống điều phối Agent:", error);
      setMessages((prevMsgs) => [
        ...prevMsgs,
        { role: "system", content: "Đã xảy ra lỗi trong quá trình Agent xử lý dữ liệu." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [agent, isLoading]);

  const resetChat = useCallback(() => {
    sessionRef.current.history = [];
    sessionRef.current.state = {
      step: 0,
      maxSteps: agent.maxSteps || 10,
      isFinished: false,
    };
    setMessages([]);
    setIsLoading(false);
  }, [agent]);

  return {
    messages,
    isLoading,
    sendMessage,
    resetChat,
    collectedData: sessionRef.current.collectedData,
  };
}
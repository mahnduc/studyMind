// src/hooks/useAgentChat.ts
import { useState, useCallback } from "react";
import { AgentConfig, AgentSession, ChatMessage } from "@/agent/core/types";
import { groqChat } from "@/agent/core/orchestrator";

interface UseAgentChatProps {
  agent: AgentConfig;
  initialCollectedData?: Record<string, any>;
}

export function useAgentChat({ agent, initialCollectedData = {} }: UseAgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [session, setSession] = useState<AgentSession>(() => ({
    history: [],
    collectedData: initialCollectedData,
    state: {
      step: 0,
      maxSteps: agent.maxSteps || 10,
      isFinished: false,
    },
  }));

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);

    const updatedSession: AgentSession = {
      ...session,
      state: {
        ...session.state,
        step: 0,
        isFinished: false,
      },
    };

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);

    try {
      await groqChat({
        message: text,
        agent,
        session: updatedSession,
      });
      setMessages([...updatedSession.history]);
      setSession(updatedSession);
    } catch (error) {
      console.error("Lỗi khi Agent xử lý hội thoại:", error);
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Đã xảy ra lỗi trong quá trình Agent suy luận." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [agent, isLoading, session]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setSession({
      history: [],
      collectedData: initialCollectedData,
      state: { step: 0, maxSteps: agent.maxSteps || 10, isFinished: false },
    });
    setIsLoading(false);
  }, [agent, initialCollectedData]);

  return {
    messages,
    isLoading,
    sendMessage,
    resetChat,
    collectedData: session.collectedData, // Giúp UI đọc được dữ liệu do các tool vừa thu thập
  };
}
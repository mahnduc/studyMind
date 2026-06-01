"use client";

import { useState, useEffect, useRef } from "react";
import { BotMessageSquare, RefreshCw, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentStrategyRequest } from "./QuizDetailChart";
import { useAgentChat } from "./useChat";
import { quizStrategyCoachAgent } from "@/agent/members/learning-strategist";

interface AgentPageProps {
  quizPayload?: AgentStrategyRequest;
  onClose?: () => void;
}

export default function AgentPage({ quizPayload, onClose }: AgentPageProps) {
  const [input, setInput] = useState("");
  const hasTriggeredInitial = useRef(false);
  const { messages, isLoading, sendMessage, resetChat } = useAgentChat({
    agent: quizStrategyCoachAgent,
    initialCollectedData: {
      quizRequest: quizPayload,
    },
  });

  useEffect(() => {
    if (quizPayload && !hasTriggeredInitial.current && messages.length === 0 && !isLoading) {
      hasTriggeredInitial.current = true;
      sendMessage("Hãy thực thi công cụ 'analyze_quiz_history' để bóc tách lịch sử làm bài và đề xuất chiến lược học tập.");
    }
  }, [quizPayload, sendMessage, messages.length, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const textToSend = input;
    setInput("");
    await sendMessage(textToSend);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f9f9f9] text-[#0d0d0d] overflow-hidden" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="bg-white border-b border-[#e3e3e3]/60 px-6 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cố vấn chiến lược AI</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              hasTriggeredInitial.current = false;
              resetChat();
            }}
            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Quay lại biểu đồ"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-24">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && isLoading && (
              <div className="text-center pt-16 space-y-3">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-600 mx-auto" />
                <p className="text-sm text-gray-400">Agent đang bóc tách số liệu lịch sử...</p>
              </div>
            )}
            {messages.map((msg, index) => {
              if (msg.role === "tool") return null;
              if (msg.role === "user") {
                const isInitialPrompt = msg.content?.includes("analyze_quiz_history");
                return (
                  <div key={index} className="flex justify-end">
                    <div className="bg-[#f4f4f4] text-[#0d0d0d] px-4 py-2.5 rounded-2xl max-w-[80%] inline-block text-sm shadow-sm border border-gray-200/50">
                      {isInitialPrompt ? "📊 Yêu cầu phân tích và lập chiến lược học tập tổng thể" : msg.content}
                    </div>
                  </div>
                );
              }
              return (
                <div key={index} className="flex justify-start items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-sm">
                    <BotMessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1 max-w-[85%] space-y-2">
                    <div className="text-[#0d0d0d] px-1 py-1 text-sm md:text-base leading-relaxed break-words">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          h1: ({ children }) => <h1 className="text-xl font-bold border-b border-gray-200 pb-1 mt-4 mb-2 text-emerald-800">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2 text-emerald-700">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-bold mt-3 mb-1 text-gray-800">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-800">{children}</li>,
                          code: ({ children }) => <code className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-xs font-mono text-red-600">{children}</code>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-emerald-500 bg-emerald-50/50 pl-3 py-1 my-2 italic rounded-r text-gray-700">{children}</blockquote>,
                          table: ({ children }) => <div className="overflow-x-auto my-3"><table className="min-w-full border-collapse border border-gray-300 rounded-lg overflow-hidden text-sm">{children}</table></div>,
                          thead: ({ children }) => <thead className="bg-gray-100 border-b border-gray-300">{children}</thead>,
                          th: ({ children }) => <th className="border border-gray-300 px-3 py-2 font-semibold text-left">{children}</th>,
                          td: ({ children }) => <td className="border border-gray-300 px-3 py-1.5 bg-white">{children}</td>,
                        }}
                      >
                        {msg.content || ""}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="bg-[#f9f9f9] border-t border-[#e3e3e3]/50 pb-6 pt-4 px-4 shrink-0 z-10">
        <div className="max-w-3xl mx-auto relative flex items-center bg-[#f4f4f4] rounded-3xl border border-[#e3e3e3] focus-within:border-[#b4b4b4] transition-all duration-200 shadow-sm">
          <input
            type="text"
            placeholder={isLoading ? "Vui lòng chờ đợi..." : "Trò chuyện thêm với cố vấn..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
            className="w-full bg-transparent py-4 pl-5 pr-14 text-sm outline-none text-[#0d0d0d] placeholder-gray-400 disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-3 p-2 rounded-full transition-all duration-200 ${
              input.trim() && !isLoading ? "bg-[#0d0d0d] text-white hover:opacity-90" : "bg-[#e3e3e3] text-gray-400 cursor-not-allowed"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
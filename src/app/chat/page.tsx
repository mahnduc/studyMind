"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAgent } from "@/core/features/chat/hooks/useAgent";

export default function ChatInterface() {
  const { messages, agentState, isLoading, error, sendMessage, reset } = useAgent();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, agentState]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const tempInput = input;
    setInput("");
    await sendMessage(tempInput);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white text-slate-800 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">StudyMind AI</h1>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${agentState === "error" ? "bg-red-500" : isLoading ? "bg-amber-400" : "bg-emerald-500"}`} />
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              {agentState}
            </span>
          </div>
        </div>
        <button 
          onClick={reset} 
          className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
        >
          Làm mới
        </button>
      </div>

      {/* Chat Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <p className="text-sm">Bắt đầu câu hỏi của bạn...</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                isUser 
                  ? "bg-[#3498db] text-white rounded-tr-none shadow-sm" 
                  : "bg-gray-100 text-slate-700 rounded-tl-none"
              }`}>
                {msg.content}
                {!isUser && agentState === "streaming" && index === messages.length - 1 && (
                  <span className="inline-block w-1 h-4 ml-1 bg-[#3498db] animate-pulse align-middle" />
                )}
              </div>
            </div>
          );
        })}

        {/* Status Indicators */}
        {(agentState === "thinking" || agentState === "busy") && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                {agentState === "thinking" ? "Đang suy nghĩ" : "Đang xử lý công cụ"}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-xs p-3 bg-red-50 border border-red-100 rounded-lg text-red-500 text-xs text-center">
            {error}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Vui lòng đợi..." : "Nhập tin nhắn..."}
            disabled={isLoading}
            className="flex-1 bg-gray-100 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#3498db]/20 outline-none transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-[#3498db] text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#2980b9] disabled:bg-gray-200 disabled:text-gray-400 transition-all"
          >
            {isLoading ? "..." : "Gửi"}
          </button>
        </form>
        
      </div>
    </div>
  );
}
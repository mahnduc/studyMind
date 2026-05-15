"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AgentRuntime } from "../../agent/runtime/runtime";
import { useAgent, ChatMessage } from "./hooks/useAgent";
import { AgentState } from "../../agent/runtime/types";

import { 
  Brain, 
  Search, 
  PenTool, 
  Save, 
  FileText, 
  HelpCircle, 
  Wrench, 
  Send, 
  AlertTriangle 
} from "lucide-react";

// --- Sub-components ---

function AgentStateIndicator({ state }: { state: AgentState }) {
  const labels: Partial<Record<AgentState, string>> = {
    classifying:   "Đang phân tích...",
    planning:      "Đang lên kế hoạch...",
    executing:     "Đang xử lý...",
    streaming:     "Đang trả lời...",
    awaiting_human:"Đang chờ xác nhận...",
    reasoning:     "Đang suy luận...",
  } as Partial<Record<AgentState, string>>;

  const label = labels[state];
  if (!label) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#2D3436] bg-[#F0F0F5] rounded-full w-fit animate-in fade-in slide-in-from-left-2">
      <span className="w-1.5 h-1.5 rounded-full bg-[#00CEC9] animate-pulse" />
      {label}
    </div>
  );
}

function ToolCallBadge({ toolName }: { toolName: string }) {
  const icons: Record<string, React.ReactNode> = {
    "search-knowledge-base": <Search size={14} />,
    "generate-quiz": <PenTool size={14} />,
    "save-quiz": <Save size={14} />,
    "load-document": <FileText size={14} />,
    "ask-user-confirmation": <HelpCircle size={14} />,
  };
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold rounded-[8px] bg-white border-[1.5px] border-[#F0F0F0] text-[#B2BEC3] shadow-[0_2px_0_0_rgba(0,0,0,0.04)] w-fit">
      <span className="text-[#00CEC9]">{icons[toolName] ?? <Wrench size={14} />}</span>
      <span className="text-[#2D3436]">Công cụ: {toolName}</span>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";

  if (isTool) {
    return (
      <div className="my-2 ml-12">
        <ToolCallBadge toolName={message.toolName ?? "tool"} />
      </div>
    );
  }

  if (!isUser && (!message.content || message.content.trim().length === 0)) {
    return null;
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 items-end gap-2 animate-in fade-in duration-300`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#FF3399] border-2 border-white flex items-center justify-center text-white text-[13px] font-extrabold shrink-0 shadow-[0_2px_0_0_rgba(0,0,0,0.1)]">
          A
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 text-[15px] leading-[1.6] whitespace-pre-wrap break-words relative transition-transform duration-70
          ${
            isUser
              ? "bg-[#FF3399] text-white rounded-[24px] rounded-br-[4px] border-b-4 border-[#D12A7E]"
              : "bg-white text-[#2D3436] border-[1.5px] border-[#F0F0F0] rounded-[24px] rounded-bl-[4px] shadow-[0_2px_0_0_rgba(0,0,0,0.08)]"
          }`}
      >
        {message.content}
        {message.isStreaming && (
          <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-white border-[1.5px] border-[#B2BEC3] flex items-center justify-center text-[13px] font-bold text-[#2D3436] shrink-0">
          U
        </div>
      )}
    </div>
  );
}

function MessageList({
  messages,
  isProcessing,
  agentState,
}: {
  messages: ChatMessage[];
  isProcessing: boolean;
  agentState: AgentState;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, agentState]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1 bg-[#F7F9FB] font-['Nunito',_sans-serif]">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center text-[#B2BEC3] gap-4 py-16 max-w-sm mx-auto">
          <p className="text-[24px] font-extrabold text-[#2D3436] leading-[1.2]">Xin chào! <br/>Tôi là trợ lý học tập của bạn.</p>
        </div>
      )}
      
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Hiển thị trạng thái đang xử lý ở cuối danh sách tin nhắn */}
      {isProcessing && (
        <div className="ml-12 my-3">
          <AgentStateIndicator state={agentState} />
        </div>
      )}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}

function ApprovalDialog({
  reason,
  approvalId,
  onApprove,
  onReject,
}: {
  reason: string;
  approvalId: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="absolute inset-0 bg-[#2D3436]/50 backdrop-blur-[4px] flex items-center justify-center z-50 px-4">
      <div className="bg-white border-[1.5px] border-[#F0F0F0] rounded-[24px] p-6 max-w-sm w-full shadow-[0_24px_48px_rgba(0,0,0,0.16)] text-center font-['Nunito',_sans-serif]">
        <div className="mx-auto text-[#00CEC9] bg-[#E0FFFE] w-12 h-12 rounded-full flex items-center justify-center mb-3">
          <HelpCircle size={28} />
        </div>
        <p className="text-[20px] font-bold text-[#2D3436] mb-1 leading-[1.35]">Xác nhận hành động</p>
        <p className="text-[13px] text-[#B2BEC3] mb-5 leading-[1.5]">{reason}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onReject(approvalId)}
            className="flex-1 order-2 sm:order-1 py-2.5 px-4 rounded-[24px] border-[1.5px] border-[#B2BEC3] text-[15px] font-bold text-[#B2BEC3] hover:bg-[#F7F9FB] active:translate-y-[2px] transition-all"
          >
            Từ chối
          </button>
          <button
            onClick={() => onApprove(approvalId)}
            className="flex-1 order-1 sm:order-2 py-2.5 px-4 rounded-[24px] bg-[#FF3399] border-b-4 border-[#D12A7E] text-[15px] font-bold text-white hover:brightness-[1.05] active:translate-y-[2px] active:border-b-2 transition-all"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="p-4 border-t-[1.5px] border-[#F0F0F0] bg-white font-['Nunito',_sans-serif]">
      <div className="flex items-end gap-3 bg-[#F7F9FB] border-[1.5px] border-[#B2BEC3] focus-within:border-[#FF3399] focus-within:ring-2 focus-within:ring-[#FF3399]/20 rounded-[24px] px-4 py-2.5 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi về tài liệu, tạo quiz..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-[15px] text-[#2D3436] placeholder-[#B2BEC3] resize-none outline-none leading-relaxed py-1 max-h-40 disabled:opacity-50 font-normal"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="w-9 h-9 rounded-[16px] bg-[#00CEC9] border-b-4 border-[#00A8A3] text-white flex items-center justify-center shrink-0 disabled:opacity-30 disabled:border-b-0 disabled:translate-y-[4px] hover:brightness-[1.05] active:translate-y-[2px] active:border-b-2 transition-all mb-0.5"
        >
          <Send size={16} strokeWidth={2.5} />
        </button>
      </div>
      <p className="text-center text-[12px] font-semibold text-[#B2BEC3] mt-2">
        Enter để gửi · Shift+Enter xuống dòng
      </p>
    </div>
  );
}

// --- Main ChatPage ---

interface ChatPageProps {
  runtime: AgentRuntime;
  sessionId?: string;
}

export function ChatPage({ runtime, sessionId = "default" }: ChatPageProps) {
  const {
    messages,
    agentState,
    isProcessing,
    pendingApproval,
    error,
    send,
    approve,
    reject,
    clearError,
  } = useAgent(runtime, sessionId);

  return (
    <div className="relative flex flex-col h-full bg-white font-['Nunito',_sans-serif]">
      {/* Header */}
      <div className="px-4 py-4 border-b-[1.5px] border-[#F0F0F0] flex items-center gap-3 bg-white">
        <div className="w-10 h-10 rounded-full bg-[#FF3399] border-2 border-white flex items-center justify-center text-white text-[16px] font-extrabold shadow-[0_2px_0_0_rgba(0,0,0,0.1)] shrink-0">
          A
        </div>
        <div>
          <p className="text-[16px] font-bold text-[#2D3436] leading-[1.3]">Trợ lý học tập</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${isProcessing ? "bg-[#00CEC9] animate-pulse" : "bg-[#00B894]"}`} />
            <p className="text-[13px] font-semibold text-[#B2BEC3] leading-none">
              {isProcessing ? "Đang xử lý..." : "Sẵn sàng"}
            </p>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 px-4 py-3 bg-[#FFF5FA] border-[1.5px] border-[#FF3399] rounded-[12px] flex items-center justify-between text-[13px] text-[#FF3399] font-semibold shadow-[0_2px_0_0_rgba(0,0,0,0.04)] animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
          <button 
            onClick={clearError} 
            className="ml-3 font-extrabold text-[#D12A7E] hover:underline focus:outline-none"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        isProcessing={isProcessing}
        agentState={agentState}
      />

      {/* Input */}
      <ChatInput onSend={send} disabled={isProcessing} />

      {/* Approval dialog overlay */}
      {pendingApproval && (
        <ApprovalDialog
          reason={pendingApproval.reason}
          approvalId={pendingApproval.approvalId}
          onApprove={approve}
          onReject={reject}
        />
      )}
    </div>
  );
}
import React from 'react';
import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // parse plaintext đầu vào thành markdown để hiển thị
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

interface BotMessageProps {
  content?: string;
  isLoading?: boolean;
  isMarkdown?: boolean;
  isError?: boolean;
  isAction?: boolean;
  metadata?: {
    tokens?: number;
    model?: string;
    toolName?: string;
    thinking?: string;
  };
}

export const BotMessage = ({ content, isLoading }: BotMessageProps) => {
  return (
    <div className={`flex justify-start mb-8 ${isLoading ? 'animate-pulse' : 'animate-in fade-in slide-in-from-bottom-3 duration-400'}`}>
      <div className="flex gap-4 max-w-[85%] md:max-w-[75%]">
        {/* Avatar Bot */}
        <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border-b-4 bg-[#FF3399] border-[#D12A7E]">
          <Bot size={20} className="text-white" strokeWidth={2.5} />
        </div>

        {/* Nội dung tin nhắn */}
        <div className={`p-4 rounded-2xl text-[15px] font-semibold leading-relaxed shadow-sm bg-white border-2 border-[#E5E5E5] border-b-4 text-[#2D3436] rounded-tl-none ${isLoading ? 'text-[#B2BEC3]' : ''}`}>
          {isLoading ? (
            "AI đang gõ..."
          ) : (
            <div className="prose prose-sm max-w-none break-words">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Tùy chỉnh hiển thị thẻ <a>
                  a: ({ node, ...props }) => {
                    const isInternal = props.href?.startsWith('/');
                    if (isInternal) {
                      return <Link href={props.href!} className="text-[#1CB0F6] hover:underline" {...props} />;
                    }
                    return <a target="_blank" rel="noopener noreferrer" className="text-[#1CB0F6] hover:underline" {...props} />;
                  },
                  // Tùy chỉnh danh sách
                  ul: ({ node, ...props }) => <ul className="list-disc ml-4" {...props} />,
                  ol: ({ node, ...props }) => <ul className="list-decimal ml-4" {...props} />,
                  // Code block đơn giản
                  code: ({ node, ...props }) => <code className="bg-gray-100 px-1 rounded text-pink-600" {...props} />,
                }}
              >
                {content || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
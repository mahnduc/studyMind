import React from 'react';
import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

type BotMessageProps = {
  content: string;
};

export const BotMessage = ({ content }: BotMessageProps) => {
  return (
    <div className="flex justify-start mb-8 animate-in fade-in slide-in-from-bottom-3 duration-400">
      <div className="flex gap-4 max-w-[85%] md:max-w-[75%]">
        
        {/* Avatar Bot - Cố định hiển thị */}
        <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border-b-4 bg-[#FF3399] border-[#D12A7E]">
          <Bot size={20} className="text-white" strokeWidth={2.5} />
        </div>

        {/* Khung nội dung */}
        <div className="p-4 rounded-2xl text-[15px] font-semibold leading-relaxed shadow-sm bg-white border-2 border-[#E5E5E5] border-b-4 text-[#2D3436] rounded-tl-none">
          <div className="prose prose-sm max-w-none break-words prose-p:leading-relaxed prose-pre:p-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Tùy chỉnh hiển thị Link
                a: ({ node, ...props }) => {
                  const isInternal = props.href?.startsWith('/');
                  const style = "text-[#1CB0F6] hover:underline font-bold transition-colors";
                  
                  if (isInternal) {
                    return <Link href={props.href!} className={style}>{props.children}</Link>;
                  }
                  return (
                    <a 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={style} 
                      {...props} 
                    />
                  );
                },
                // Tùy chỉnh danh sách
                ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-2 my-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal ml-4 space-y-2 my-2" {...props} />,
                // Code block nội dòng
                code: ({ node, inline, ...props }: any) => (
                  <code 
                    className={`${
                      inline 
                        ? "bg-[#F1F2F6] px-1.5 py-0.5 rounded text-[#FF3399] font-mono text-sm" 
                        : "block bg-[#2D3436] text-white p-3 rounded-lg my-2 font-mono text-xs overflow-x-auto"
                    }`} 
                    {...props} 
                  />
                ),
                // Tùy chỉnh đoạn văn để tránh khoảng cách thừa
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>

      </div>
    </div>
  );
};
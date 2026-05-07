import React from 'react';
import { User } from 'lucide-react';

interface UserMessageProps {
  content: string;
  isMarkdown?: boolean;
  isError?: boolean;
}

export const UserMessageComponent = ({ content }: UserMessageProps) => {
  return (
    <div className="flex justify-end mb-8 animate-in fade-in slide-in-from-bottom-3 duration-400">
      <div className="flex gap-4 max-w-[85%] md:max-w-[75%] flex-row-reverse">
        <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border-b-4 bg-[#2D3436] border-[#000000]">
          <User size={20} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="p-4 rounded-2xl text-[15px] font-semibold leading-relaxed shadow-sm bg-[#2D3436] text-white border-b-4 border-[#000000] rounded-tr-none">
          {content}
        </div>
      </div>
    </div>
  );
};
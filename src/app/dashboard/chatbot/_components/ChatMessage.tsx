'use client';

import React from 'react';
import { BotMessage } from './BotMessage';
import { UserMessageComponent } from './UserMessageComponent';
import { Message } from '../_service/message';
import { CapabilitiesList } from './CapabilitiesList';
import { KnowledgeBaseList } from './KnowledgeBaseList';


type Props = {
  message: Message;
};

export const ChatMessage = ({ 
  message, 
  onAction
}: { 
  message: Message, 
  onAction?: (text: string) => void 
}) => {
  const { role, content } = message;

  switch (role) {
    case 'user':
      return <UserMessageComponent content={content} />;

    case 'assistant':
      if (content === '[SHOW_CAPABILITIES_CMPT]') {
        return (
          <div className="flex flex-col space-y-2">
            <BotMessage content="Dưới đây là các chức năng tôi có thể hỗ trợ bạn:" />
            <div className="ml-12 mr-4">
               <CapabilitiesList onSelect={(text) => onAction?.(text)} /> {/* data upward */}
            </div>
          </div>
        );
      }

      if (content === '[CALL_TOOL_BM25_SEARCH]') {
        return (
          <div className="flex flex-col space-y-2">
            <BotMessage content="Hãy chọn kho tri thức mà bạn muốn tra cứu:" />
            <div className="ml-12 mr-4">
               <KnowledgeBaseList onSelect={(kbName) => onAction?.(`Tìm kiếm trong kho: ${kbName}`)} />
            </div>
          </div>
        );
      }

      return <BotMessage content={content} />;

    case 'system':
      return (
        <div className="my-4 flex items-center justify-center gap-4">
          <div className="h-[1px] flex-1 bg-gray-100" />
          <div className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {content}
          </div>
          <div className="h-[1px] flex-1 bg-gray-100" />
        </div>
      );

    default:
      return null;
  }
};
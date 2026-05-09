// dashboard/chatbot/_service/message.ts
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; 
  };
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface BaseMessage {
  id: number;
  conversationId: number;
  role: MessageRole;
  content: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface UserMessage extends BaseMessage {
  role: 'user';
}

export interface AssistantMessage extends BaseMessage {
  role: 'assistant';
  model?: string;
  tool_calls?: ToolCall[];
}

export interface SystemMessage extends BaseMessage {
  role: 'system';
}

export type Message = UserMessage | AssistantMessage | SystemMessage;
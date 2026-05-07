// dashboard/chatbot/_service/message.ts
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'markdown' | 'action' | 'loading' | 'error';

export interface Message {
  id: number;
  conversationId: number;
  role: MessageRole;
  type: MessageType;
  content: string;
  createdAt: string;
  metadata?: Record<string, any>; // tổng hợp
}
// hàm xử lý tạo chat
export const createMessage = (
  role: MessageRole,
  content: string = '',
  overrides: Partial<Omit<Message, 'role'>> = {} // cho phép ghi đè mọi thứ trừ role
): Message => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  conversationId: 0,
  role,
  content,
  type: 'markdown',
  createdAt: new Date().toISOString(),
  ...overrides,
});
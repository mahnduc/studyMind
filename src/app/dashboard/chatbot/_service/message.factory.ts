// _services/message.factory.ts

import { Message } from '../_service/message';

export function createUiMessage(
  role: Message['role'],
  content: string,
  conversationId: number,
  extra?: Partial<Message>
): Message {
  return {
    id: Date.now() + Math.random(),
    role,
    content,
    conversationId,
    createdAt: new Date().toISOString(),
    ...extra,
  };
}
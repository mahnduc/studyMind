// _services/conversation.service.ts

import { getChatHistory } from '../_service/db';
import { Message } from '../_service/message';

export async function loadConversation(id: number): Promise<Message[]> {
  const history = await getChatHistory(id);

  return history.map((item) => ({
    id: item.id,
    role: item.role as Message['role'],
    content: item.content,
    conversationId: item.conversation_id,
    createdAt: item.created_at,
  }));
}
// _services/request.builder.ts

import { SYSTEM_PROMPT } from '../prompt/system';
import { toolList } from '../_utils/toolList';
import { CHAT_CONFIG } from '../_config/chat.config';
import { Message } from '../_service/message';

import type {
  ChatMessage as GroqChatMessage,
  ToolDefinition,
  GroqChatRequest,
} from '../_types/groq.types';

export function buildGroqRequest(
  apiKey: string,
  conversationId: number | null,
  history: Message[],
  userText: string
): GroqChatRequest {
  const messages: GroqChatMessage[] = [
    SYSTEM_PROMPT as GroqChatMessage,
    ...history
      .slice(-CHAT_CONFIG.maxHistory)
      .map((m) => ({
        role: m.role as GroqChatMessage['role'],
        content: m.content,
      })),
    {
      role: 'user',
      content: userText,
    },
  ];

  return {
    apiKey,
    model: CHAT_CONFIG.model,
    messages,
    tools: toolList as ToolDefinition[],
    tool_choice: 'auto',
    stream: false,
    sampling: {
      temperature: CHAT_CONFIG.temperature,
      top_p: CHAT_CONFIG.topP,
      max_tokens: CHAT_CONFIG.maxTokens,
    },
    metadata: {
      conversationId: String(
        conversationId ?? ''
      ),
      feature: 'chat',
    },
    timeoutMs: CHAT_CONFIG.timeoutMs,
  };
}
// _services/chat.service.ts

import { saveMessage } from '../_service/db';
import { keyApi } from '../../settings/api-key/_api/key.api';
import { callGroqChat } from '../_service/groq';

import { buildGroqRequest } from './request.builder';
import { parseAssistantContent } from './response.parser';
import { createUiMessage } from './message.factory';

import { Message } from '../_service/message';

export async function sendChatMessage(
  text: string,
  chatId: number | null,
  history: Message[]
) {
  const [saveResult, apiKey] = await Promise.all([saveMessage(text, chatId, 'user'), keyApi.getRandomKey('groq')]);

  const activeConversationId = saveResult.isNewConversation? saveResult.conversationId : chatId;

  const request = buildGroqRequest(
    apiKey,
    activeConversationId,
    history,
    text
  );
  // gửi request nhân response từ LLM
  const response = await callGroqChat(request);

  if (
    !response.success ||
    !response.data
  ) {
    throw new Error(
      response.error?.message ??
        'AI không thể trả lời'
    );
  }

  const aiMessage = response.data.choices?.[0]?.message;

  const content = parseAssistantContent(aiMessage?.content, aiMessage?.tool_calls);

  const assistantMessage =
    createUiMessage(
      'assistant',
      content,
      activeConversationId ?? 0,
      {
        model: response.data.model,
        tool_calls:
          aiMessage?.tool_calls,
      }
    );

  return {
    assistantMessage,
    content,
    activeConversationId,
    isNewConversation: saveResult.isNewConversation,
  };
}
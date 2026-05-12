// _hooks/useMessages.ts
'use client';

import {
  useState,
  useCallback,
  useTransition,
} from 'react';
import type { Message } from '../_service/message';

export function useMessages() {
  const [messages, setMessages] =
    useState<Message[]>([]);
  const [, startTransition] =
    useTransition();

  const appendMessage = useCallback(
    (message: Message) => {
      startTransition(() => {
        setMessages((prev) => [
          ...prev,
          message,
        ]);
      });
    },
    [startTransition]
  );

  const replaceMessages =
    useCallback(
      (nextMessages: Message[]) => {
        startTransition(() => {
          setMessages(nextMessages);
        });
      },
      [startTransition]
    );

  const clearMessages =
    useCallback(() => {
      startTransition(() => {
        setMessages([]);
      });
    }, [startTransition]);

  return {
    messages,
    setMessages: replaceMessages,
    appendMessage,
    clearMessages,
  };
}
// _hooks/useChatScroll.ts
'use client';

import { useEffect, useRef } from 'react';

export function useChatScroll(
  dependencies: unknown[]
) {
  const scrollRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top:
          scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, dependencies);

  return scrollRef;
}
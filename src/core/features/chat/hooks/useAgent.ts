"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { AgentRuntime } from "@/core/agent/runtime/agent-runtime";
import { AgentState } from "@/core/agent/state/agent-state";
import { ChatMessage } from "@/core/agent/types/chat.types";

export function useAgent() {
  const runtime = useMemo(() => new AgentRuntime(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const events = runtime.events;

    const handleMessagesUpdate = (updatedMessages: ChatMessage[]) => {
      setMessages(updatedMessages.map((msg) => ({ ...msg })));
    };

    const handleState = (state: AgentState) => () => setAgentState(state);
    const handleError = (msg: string) => {
      setAgentState("error");
      setError(msg || "An error occurred.");
    };

    const stateEvents: Record<string, () => void> = {
      idle: handleState("idle"),
      thinking: handleState("thinking"),
      streaming: handleState("streaming"),
      busy: handleState("busy"),
      completed: handleState("completed"),
    };

    events.on("messages_updated", handleMessagesUpdate);
    events.on("error", handleError);
    Object.entries(stateEvents).forEach(([ev, handler]) => events.on(ev, handler));

    return () => {
      events.off("messages_updated", handleMessagesUpdate);
      events.off("error", handleError);
      Object.entries(stateEvents).forEach(([ev, handler]) => events.off(ev, handler));
    };
  }, [runtime]);

  const sendMessage = useCallback(async (input: string) => {
    setError(null);
    try {
      for await (const _ of runtime.runStream(input)) {
        // UI updates via EventEmitter
      }
    } catch (err: any) {
      setError(err?.message || "Unknown error");
    }
  }, [runtime]);

  const reset = useCallback(() => {
    setMessages([]);
    setAgentState("idle");
    setError(null);
  }, []);

  return {
    messages,
    agentState,
    isLoading: ["thinking", "streaming", "busy"].includes(agentState),
    error,
    sendMessage,
    reset,
  };
}
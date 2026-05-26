// src/core/agent/context.ts tầng quản lý bộ nhớ
import { AgentConfig, AgentSession, ChatMessage } from "./types";

const MAX_HISTORY = 20;

export function buildMessages(agent: AgentConfig, session: AgentSession): ChatMessage[] {
  return [
    {
      role: "system",
      content: agent.systemPrompt,
    },
    ...session.history.slice(-MAX_HISTORY),
  ];
}

export function initializeAgentState(agent: AgentConfig, session: AgentSession): void {
  if (!session.state) {
    session.state = {
      step: 0,
      maxSteps: agent.maxSteps || 10,
      isFinished: false,
    };
  }
}
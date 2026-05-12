// core/agent/types/chat.types.ts

export type Role =
  | "system"
  | "user"
  | "assistant"
  | "tool";

interface BaseMessage {
  content: string;
}

export interface SystemMessage
  extends BaseMessage {
  role: "system";
}

export interface UserMessage
  extends BaseMessage {
  role: "user";
}

export interface AssistantMessage
  extends BaseMessage {
  role: "assistant";
  tool_calls?: any[];
}

export interface ToolMessage
  extends BaseMessage {
  role: "tool";
  tool_call_id: string;
}

export type ChatMessage =
  | SystemMessage
  | UserMessage
  | AssistantMessage
  | ToolMessage;
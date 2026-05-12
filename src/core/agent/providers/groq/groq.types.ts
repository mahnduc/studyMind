export type Role =
  | "system"
  | "user"
  | "assistant"
  | "tool";

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  role: Role;
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface GroqChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  tools?: unknown[];
  tool_choice?: "auto" | "none";
  stream?: boolean;
}

export interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];

  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GroqStreamDelta {
  id: string;
  choices: {
    delta: {
      content?: string;
      tool_calls?: any[];
    };
    finish_reason: string | null;
  }[];
}
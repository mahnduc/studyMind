export type ChatRole =
  | "system"
  | "user"
  | "assistant"
  | "tool";

export interface ChatMessage {
  role: ChatRole;
  content?: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[]; // các tham số yêu cầu của riêng từng tool
    };
  };
}

// Phát lệnh gọi
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ToolExecutor {
  name: string;
  execute: (
    args: any,
    session: AgentSession
  ) => Promise<ToolResult>;
}

export interface AgentState {
  step: number;
  maxSteps: number;
  isFinished: boolean;
}

export interface AgentSession<TData = any> {
  history: ChatMessage[];
  collectedData: TData;
  state: AgentState;
}

export interface AgentConfig {
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxSteps?: number;
  history?: ChatMessage[];
  tools?: ToolDefinition[];
  executors?: ToolExecutor[];
}
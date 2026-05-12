// Định nghĩa Message & Tools
export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string từ model
  };
}

export interface ChatMessage {
  role: ChatRole;
  content: string | null;
  /** Dùng khi role = "tool" để map với request của assistant */
  tool_call_id?: string;
  /** Dùng khi assistant muốn gọi 1 hoặc nhiều tools */
  tool_calls?: ToolCall[];
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>; // JSON Schema format
  };
}

export type ToolChoice =
  | "none"
  | "auto"
  | "required"
  | { type: "function"; function: { name: string } };

// Cấu hình Model & Sampling
export interface SamplingConfig {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
}

export interface ResponseFormat {
  type: "text" | "json_object";
}

// Metadata & Context (Internal Only)
export interface ChatMetadata {
  conversationId?: string;
  userId?: string;
  requestId?: string;
  feature?: "chat" | "rag" | "agent" | "summarizer";
}
// Payload Inputs
/** Input chuẩn truyền vào hàm callGroqChat() */
export interface GroqChatRequest {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  tool_choice?: ToolChoice;
  stream?: boolean;
  sampling?: SamplingConfig;
  response_format?: ResponseFormat;
  metadata?: ChatMetadata;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/** Body thực tế gửi lên Endpoint của Groq */
export interface GroqHttpBody {
  model: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  tool_choice?: ToolChoice;
  stream?: boolean;
  response_format?: ResponseFormat;
  // Flat sampling params
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
}

// Response Outputs (Cấu trúc trả về từ API)
export interface GroqUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_time?: number;
  completion_time?: number;
  total_time?: number;
}

export interface GroqChatCompletion {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: "stop" | "length" | "tool_calls" | "content_filter";
    logprobs?: unknown;
  }[];
  usage: GroqUsage;
  system_fingerprint?: string;
}

/** Cấu trúc một chunk khi dùng Stream */
export interface GroqStreamChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: {
    index: number;
    delta: Partial<ChatMessage>;
    finish_reason: string | null;
  }[];
  x_groq?: { usage?: GroqUsage };
}

/** Kết quả trả về cuối cùng của hàm wrapper */
export interface GroqActionResult<T = GroqChatCompletion> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
  metadata?: ChatMetadata;
}

// Helper Functions

/** Chuyển đổi từ Request Object sang HTTP Body chuẩn của Groq */
export const mapRequestToHttpBody = (req: GroqChatRequest): GroqHttpBody => {
  return {
    model: req.model,
    messages: req.messages,
    tools: req.tools,
    tool_choice: req.tool_choice,
    stream: req.stream ?? false,
    response_format: req.response_format,
    ...(req.sampling || {}),
  };
};
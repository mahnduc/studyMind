// FILE: core/agent/providers/provider.interface.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: Interface trừu tượng cho LLM providers.
//        Runtime và executors chỉ phụ thuộc vào interface này,
//        không biết về Groq hay bất kỳ provider cụ thể nào.

import { LLMToolSchema } from "../tools/types";
import { StreamChunk } from "../runtime/types";

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  name?: string; // tool name khi role = "tool"
}

export interface LLMToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface LLMResponse {
  content: string | null;
  toolCalls?: LLMToolCall[];
  finishReason: "stop" | "tool_calls" | "length" | "error";
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: LLMToolSchema[];
  toolChoice?: "auto" | "none" | "required";
}

/**
 * Interface mà mọi LLM provider phải implement.
 * Đảo ngược phụ thuộc: Runtime phụ thuộc vào interface này,
 * không phụ thuộc vào Groq hay OpenAI trực tiếp.
 */
export interface LLMProvider {
  readonly providerId: string;
  readonly defaultModel: string;

  /**
   * Gọi LLM và nhận response hoàn chỉnh.
   */
  complete(
    messages: LLMMessage[],
    options?: LLMRequestOptions
  ): Promise<LLMResponse>;

  /**
   * Gọi LLM với streaming - yield từng chunk về.
   * onChunk được gọi cho mỗi token/chunk nhận được.
   */
  stream(
    messages: LLMMessage[],
    options?: LLMRequestOptions,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<LLMResponse>;

  /**
   * Kiểm tra provider có sẵn sàng không (API key hợp lệ, etc.)
   */
  healthCheck(): Promise<boolean>;
}

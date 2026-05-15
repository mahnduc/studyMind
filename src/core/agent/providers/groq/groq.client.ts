// core/agent/providers/groq/groq.client.ts
// MÔ TẢ: Implement LLMProvider interface cho Groq API
//        Sử dụng endpoint: https://api.groq.com/openai/v1/chat/completions

import {
  LLMProvider,
  LLMMessage,
  LLMRequestOptions,
  LLMResponse,
  LLMToolCall,
} from "../provider.interface";
import { StreamChunk } from "../../runtime/types";
import { GROQ_MODELS, GROQ_DEFAULT_MODEL } from "./types";

export class GroqProvider implements LLMProvider {
  readonly providerId = "groq";
  readonly defaultModel = GROQ_DEFAULT_MODEL;

  private apiKey: string;
  private readonly baseUrl = "https://api.groq.com/openai/v1/chat/completions";

  constructor(apiKey : string) {
    if (!apiKey) throw new Error("[GroqProvider] API key is required");
    this.apiKey = apiKey;
  }

  // ── Complete (non-streaming) ───────────────────────────────

  async complete(
    messages: LLMMessage[],
    options: LLMRequestOptions = {}
  ): Promise<LLMResponse> {
    const body = this._buildRequestBody(messages, options, false);

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`[GroqProvider] HTTP ${res.status}: ${err}`);
    }

    const data = await res.json();
    return this._parseCompletionResponse(data);
  }

  // ── Stream ─────────────────────────────────────────────────

  async stream(
    messages: LLMMessage[],
    options: LLMRequestOptions = {},
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<LLMResponse> {
    const streamingEnabled = options.stream !== false;

    if (!streamingEnabled) {
      return this.complete(messages, options);
    }

    const body = this._buildRequestBody(messages, options, true);

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`[GroqProvider] Stream HTTP ${res.status}: ${err}`);
    }

    return this._consumeSSEStream(res, onChunk);
  }

  // ── Health check ───────────────────────────────────────────

  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.complete(
        [{ role: "user", content: "ping" }],
        { maxTokens: 5, model: this.defaultModel }
      );
      return res.finishReason !== "error";
    } catch {
      return false;
    }
  }

  // ── Private helpers ────────────────────────────────────────

  private _headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  private _buildRequestBody(
    messages: LLMMessage[],
    options: LLMRequestOptions,
    stream: boolean
  ) {
    const body: Record<string, unknown> = {
      model: options.model ?? this.defaultModel,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.name ? { name: m.name } : {}),
        ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
      })),
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
      stream,
    };

    if (options.tools && options.tools.length > 0) {
      body.tools = options.tools;
      body.tool_choice = options.toolChoice ?? "auto";
    }

    return body;
  }

  private _parseCompletionResponse(data: {
    choices: Array<{
      message: {
        content: string | null;
        tool_calls?: Array<{
          id: string;
          type: string;
          function: { name: string; arguments: string };
        }>;
      };
      finish_reason: string;
    }>;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }): LLMResponse {
    const choice = data.choices?.[0];
    if (!choice) throw new Error("[GroqProvider] Empty response from API");

    const toolCalls: LLMToolCall[] | undefined = choice.message.tool_calls?.map(
      (tc) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })
    );

    return {
      content: choice.message.content,
      toolCalls: toolCalls?.length ? toolCalls : undefined,
      finishReason: this._mapFinishReason(choice.finish_reason),
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  private _mapFinishReason(
    reason: string
  ): LLMResponse["finishReason"] {
    switch (reason) {
      case "tool_calls":
        return "tool_calls";
      case "length":
        return "length";
      case "stop":
        return "stop";
      default:
        return "stop";
    }
  }

  /**
   * Đọc SSE stream từ Groq và tổng hợp thành LLMResponse.
   * Mỗi dòng `data: {...}` được parse và emit qua onChunk.
   */
  private async _consumeSSEStream(
    res: Response,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<LLMResponse> {
    const reader = res.body?.getReader();
    if (!reader) throw new Error("[GroqProvider] No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    let finishReason: LLMResponse["finishReason"] = "stop";
    const toolCallsMap: Map<number, LLMToolCall> = new Map();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta;
          const reason = json.choices?.[0]?.finish_reason;

          if (reason) finishReason = this._mapFinishReason(reason);

          // Text delta
          if (delta?.content) {
            fullContent += delta.content;
            onChunk?.({ type: "text", content: delta.content });
          }

          // Tool call delta (Groq streams tool calls in chunks)
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx: number = tc.index ?? 0;
              if (!toolCallsMap.has(idx)) {
                toolCallsMap.set(idx, {
                  id: tc.id ?? "",
                  type: "function",
                  function: { name: tc.function?.name ?? "", arguments: "" },
                });
              }
              const existing = toolCallsMap.get(idx)!;
              if (tc.function?.arguments) {
                existing.function.arguments += tc.function.arguments;
              }
              if (tc.id) existing.id = tc.id;
              if (tc.function?.name) existing.function.name = tc.function.name;
            }
          }
        } catch {
          // Bỏ qua dòng parse lỗi
        }
      }
    }

    onChunk?.({ type: "done", content: "" });

    const toolCalls = Array.from(toolCallsMap.values());

    return {
      content: fullContent || null,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason,
    };
  }

  public updateToken(newApiKey: string): void {
    if (!newApiKey) {
      throw new Error("[GroqProvider] New API key cannot be empty");
    }
    this.apiKey = newApiKey;
  }
}
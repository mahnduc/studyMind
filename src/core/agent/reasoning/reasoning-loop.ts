// FILE: core/agent/reasoning/reasoning-loop.ts
// PHÂN LOẠI: Kernel
// MÔ TẢ: ReasoningLoop - vòng lặp ReAct (Reason + Act).
//        Không biết về tool cụ thể, nhận toolRegistry từ bên ngoài.
//        Vận hành như một máy trạng thái: Think → Act → Observe → Think...

import { LLMProvider, LLMMessage } from "../providers/provider.interface";
import { ToolRegistry } from "../tools/registry";
import { StreamChunk, ToolCallRecord } from "../runtime/types";
import { RuntimeContext } from "../runtime/context";

export type ReasoningLoopTypes = "think" | "act" | "observe" | "done" | "error"

export interface ReasoningStep {
  type: "think" | "act" | "observe" | "done" | "error";
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
  iteration: number;
}

export interface ReasoningLoopResult {
  success: boolean;
  finalAnswer: string;
  steps: ReasoningStep[];
  toolCallRecords: ToolCallRecord[];
  error?: string;
}

export interface ReasoningLoopOptions {
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxIterations?: number;
  allowedToolIds: string[];
}

export class ReasoningLoop {
  private readonly provider: LLMProvider;
  private readonly toolRegistry: ToolRegistry;

  constructor(provider: LLMProvider, toolRegistry: ToolRegistry) {
    this.provider = provider;
    this.toolRegistry = toolRegistry;
  }

  /**
   * Chạy vòng lặp ReAct cho đến khi đạt được câu trả lời hoặc hết iterations.
   */
  async run(
    userInput: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    options: ReasoningLoopOptions,
    ctx: RuntimeContext,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<ReasoningLoopResult> {
    const steps: ReasoningStep[] = [];
    const toolCallRecords: ToolCallRecord[] = [];
    const messages: LLMMessage[] = [
      { role: "system", content: options.systemPrompt },
      ...conversationHistory,
      { role: "user", content: userInput },
    ];

    const maxIter = options.maxIterations ?? ctx.options.maxIterations ?? 10;
    const toolSchemas = this.toolRegistry.toLLMSchemas(options.allowedToolIds);

    let iteration = 0;

    while (iteration < maxIter) {
      iteration++;
      ctx.incrementIteration();

      if (ctx.hasTimedOut()) {
        return {
          success: false,
          finalAnswer: "",
          steps,
          toolCallRecords,
          error: "Reasoning loop timed out",
        };
      }

      // ── Think: gọi LLM ────────────────────────────────────
      const response = await this.provider.stream(
        messages,
        {
          model: options.model,
          temperature: options.temperature ?? 0.3,
          tools: toolSchemas.length > 0 ? toolSchemas : undefined,
          toolChoice: toolSchemas.length > 0 ? "auto" : undefined,
        },
        onChunk
      );

      // ── Kiểm tra kết quả LLM ──────────────────────────────

      // Trường hợp 1: LLM gọi tool (Act)
      if (
        response.finishReason === "tool_calls" &&
        response.toolCalls &&
        response.toolCalls.length > 0
      ) {
        // Thêm assistant message với tool calls vào history
        messages.push({
          role: "assistant",
          content: response.content ?? "",
        });

        // Thực thi từng tool call
        for (const toolCall of response.toolCalls) {
          const toolStartTime = Date.now();
          let toolInput: Record<string, unknown> = {};

          try {
            toolInput = JSON.parse(toolCall.function.arguments);
          } catch {
            toolInput = {};
          }

          steps.push({
            type: "act",
            content: `Calling tool: ${toolCall.function.name}`,
            toolName: toolCall.function.name,
            toolInput,
            iteration,
          });

          // ── Observe: thực thi tool ────────────────────────
          const toolResult = await this.toolRegistry.execute(
            toolCall.function.name,
            toolInput
          );

          const durationMs = Date.now() - toolStartTime;
          const outputStr = JSON.stringify(toolResult.output ?? toolResult.error);

          toolCallRecords.push({
            toolName: toolCall.function.name,
            input: toolInput,
            output: toolResult.output ?? toolResult.error,
            durationMs,
          });

          steps.push({
            type: "observe",
            content: outputStr,
            toolName: toolCall.function.name,
            toolOutput: toolResult.output,
            iteration,
          });

          // Thêm tool result vào messages
          messages.push({
            role: "tool",
            content: outputStr,
            toolCallId: toolCall.id,
            name: toolCall.function.name,
          });

          onChunk?.({
            type: "tool_result",
            content: outputStr,
            metadata: { toolName: toolCall.function.name, durationMs },
          });
        }

        // Tiếp tục vòng lặp Think
        continue;
      }

      // Trường hợp 2: LLM trả về câu trả lời cuối cùng (Done)
      const finalAnswer = response.content ?? "";

      steps.push({
        type: "done",
        content: finalAnswer,
        iteration,
      });

      messages.push({ role: "assistant", content: finalAnswer });

      return {
        success: true,
        finalAnswer,
        steps,
        toolCallRecords,
      };
    }

    return {
      success: false,
      finalAnswer: "",
      steps,
      toolCallRecords,
      error: `Max reasoning iterations (${maxIter}) exceeded`,
    };
  }
}

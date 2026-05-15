// core/agent/executors/direct-executor.ts
// MÔ TẢ: Executor cho mode "direct" - gọi LLM một lần, có thể dùng tools
//        nhưng không có vòng lặp reasoning phức tạp.

import { Executor, ExecutorInput } from "./executor.registry";
import { ExecutionResult } from "../runtime/types";
import { providerRouter } from "../providers/provider-router";
import { toolRegistry } from "../tools/registry";
import { LLMMessage } from "../providers/provider.interface";
import { SYSTEM_PROMPT } from "../prompts/system.prompt";


export const directExecutor: Executor = {
  mode: "direct",

  async execute({
    capability,
    userInput,
    session,
    ctx,
    onChunk,
  }: ExecutorInput): Promise<ExecutionResult> {
    const systemPrompt =
      capability.systemPromptOverride ?? SYSTEM_PROMPT;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...session.toLLMMessages(20),
    ];

    const toolSchemas =
      capability.allowedToolIds.length > 0
        ? toolRegistry.toLLMSchemas(capability.allowedToolIds)
        : undefined;

    try {
      const response = await providerRouter.stream(
        messages,
        {
          tools: toolSchemas,
          toolChoice: toolSchemas ? "auto" : undefined,
          temperature: 0.7,
        },
        onChunk
      );

      // Nếu LLM gọi tool, thực thi và gửi lại kết quả (một lần, không loop)
      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolMessages: LLMMessage[] = [
          ...messages,
          { role: "assistant", content: response.content ?? "" },
        ];

        for (const tc of response.toolCalls) {
          let input: Record<string, unknown> = {};
          try {
            input = JSON.parse(tc.function.arguments);
          } catch { /* ignore */ }

          const result = await toolRegistry.execute(tc.function.name, input);
          const outputStr = JSON.stringify(result.output ?? result.error);

          onChunk?.({
            type: "tool_result",
            content: outputStr,
            metadata: { toolName: tc.function.name },
          });

          toolMessages.push({
            role: "tool",
            content: outputStr,
            toolCallId: tc.id,
            name: tc.function.name,
          });
        }

        // Gọi LLM lần 2 để tổng hợp kết quả tool
        const finalResponse = await providerRouter.stream(
          toolMessages,
          { temperature: 0.7 },
          onChunk
        );

        return {
          success: true,
          output: finalResponse.content ?? "",
        };
      }

      return {
        success: true,
        output: response.content ?? "",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  },
};
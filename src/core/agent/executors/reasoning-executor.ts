// core/agent/executors/reasoning-executor.ts
// MÔ TẢ: Executor cho mode "reasoning" - dùng ReasoningLoop (ReAct)

import { Executor, ExecutorInput } from "./executor.registry";
import { ExecutionResult } from "../runtime/types";
import { ReasoningLoop } from "../reasoning/reasoning-loop";
import { providerRouter } from "../providers/provider-router";
import { toolRegistry } from "../tools/registry";
import { SYSTEM_PROMPT } from "../prompts/system.prompt";
import { LLMProvider } from "../providers/provider.interface";

export const reasoningExecutor: Executor = {
  mode: "reasoning",

  async execute({
    capability,
    userInput,
    session,
    ctx,
    onChunk,
  }: ExecutorInput): Promise<ExecutionResult> {
    const loop = new ReasoningLoop(
        providerRouter as unknown as LLMProvider, // lưu ý lỗi có thể xảy ra khi cố ép kiểu
        toolRegistry
    );

    const result = await loop.run(
      userInput,
      session.toLLMMessages(20),
      {
        systemPrompt: capability.systemPromptOverride ?? SYSTEM_PROMPT,
        allowedToolIds: capability.allowedToolIds,
        maxIterations: ctx.options.maxIterations ?? 8,
        temperature: 0.3,
      },
      ctx,
      onChunk
    );

    return {
      success: result.success,
      output: result.finalAnswer,
      error: result.error,
      toolCalls: result.toolCallRecords,
    };
  },
};
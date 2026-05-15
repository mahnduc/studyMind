// FILE: core/agent/executors/workflow-executor.ts
// MÔ TẢ: Executor cho mode "workflow" - chạy các WorkflowStep tuần tự

import { Executor, ExecutorInput } from "./executor.registry";
import { ExecutionResult } from "../runtime/types";
import { workflowRegistry } from "../workflows/workflow-registry";
import {
  WorkflowExecutionState,
  WorkflowRunResult,
} from "../workflows/types";

export const workflowExecutor: Executor = {
  mode: "workflow",

  async execute({
    capability,
    userInput,
    session,
    ctx,
    onChunk,
  }: ExecutorInput): Promise<ExecutionResult> {
    const workflowId = capability.workflowId;
    if (!workflowId) {
      return {
        success: false,
        error: `Capability "${capability.id}" không có workflowId`,
      };
    }

    const workflow = workflowRegistry.get(workflowId);
    if (!workflow) {
      return {
        success: false,
        error: `Workflow không tìm thấy: "${workflowId}"`,
      };
    }

    const state: WorkflowExecutionState = {
      workflowId,
      currentStepIndex: 0,
      completedSteps: [],
      context: { userInput },
    };

    onChunk?.({
      type: "text",
      content: `🔄 Bắt đầu workflow: **${workflow.name}**\n\n`,
    });

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      state.currentStepIndex = i;

      onChunk?.({
        type: "text",
        content: `**Bước ${i + 1}/${workflow.steps.length}: ${step.name}**\n`,
      });

      const stepResult = await step.execute(state, session, ctx, onChunk);
      state.completedSteps.push(stepResult);

      if (!stepResult.success || stepResult.abort) {
        const result: WorkflowRunResult = {
          success: false,
          workflowId,
          completedSteps: state.completedSteps,
          abortedAtStep: step.id,
          error: stepResult.error ?? "Workflow bị dừng sớm",
          output: state.context.finalOutput as string | undefined,
        };
        return result;
      }

      // Lưu output của step vào shared context
      state.context[step.id] = stepResult.output;
    }

    const result: WorkflowRunResult = {
      success: true,
      workflowId,
      completedSteps: state.completedSteps,
      output: (state.context.finalOutput as string) ?? "Workflow hoàn thành.",
    };

    return result;
  },
};
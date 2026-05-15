// core/agent/workflows/definitions/generate-quiz.workflow.ts
// MÔ TẢ: Workflow tạo quiz đa bước: tìm tài liệu → tạo quiz → xác nhận → lưu

import { WorkflowDefinition, WorkflowStep, WorkflowStepResult } from "../types";
import { toolRegistry } from "../../tools/registry";

const searchStep: WorkflowStep = {
  id: "search-content",
  name: "Tìm nội dung tài liệu",
  async execute(state, session, ctx, onChunk) {
    onChunk?.({ type: "text", content: "Đang tìm kiếm nội dung liên quan...\n" });
    const query = state.context.userInput as string;

    const result = await toolRegistry.execute("search-knowledge-base", {
      query,
      topK: 8,
    });

    if (!result.success) {
      return { stepId: "search-content", success: false, error: result.error };
    }

    const output = result.output as { found: boolean; chunks: Array<{ content: string; source: string }> };
    if (!output.found || output.chunks.length === 0) {
      onChunk?.({ type: "text", content: "Không tìm thấy nội dung phù hợp trong tài liệu.\n" });
      return { stepId: "search-content", success: false, abort: true, error: "Không có nội dung" };
    }

    const combinedContent = output.chunks.map((c) => c.content).join("\n\n");
    state.context.searchedContent = combinedContent;
    state.context.sources = [...new Set(output.chunks.map((c) => c.source))];

    onChunk?.({ type: "text", content: `Tìm thấy ${output.chunks.length} đoạn từ: ${(state.context.sources as string[]).join(", ")}\n\n` });
    return { stepId: "search-content", success: true, output: combinedContent };
  },
};

const generateStep: WorkflowStep = {
  id: "generate-questions",
  name: "Tạo câu hỏi trắc nghiệm",
  async execute(state, session, ctx, onChunk) {
    onChunk?.({ type: "text", content: "Đang tạo câu hỏi trắc nghiệm...\n" });

    const result = await toolRegistry.execute("generate-quiz", {
      content: state.context.searchedContent as string,
      questionCount: (state.context.questionCount as number) ?? 5,
      difficulty: (state.context.difficulty as string) ?? "mixed",
      topic: state.context.userInput as string,
    });

    if (!result.success) {
      return { stepId: "generate-questions", success: false, error: result.error };
    }

    const output = result.output as { questions: unknown[]; count: number; topic: string };
    state.context.generatedQuiz = output;
    onChunk?.({ type: "text", content: `Đã tạo ${output.count} câu hỏi về chủ đề: "${output.topic}"\n\n` });

    // Hiển thị preview câu hỏi
    const questions = output.questions as Array<{ content: string; options: Array<{ id: string; text: string }> }>;
    questions.slice(0, 3).forEach((q, i) => {
      onChunk?.({ type: "text", content: `**Câu ${i + 1}:** ${q.content}\n` });
      q.options.forEach((o) => {
        onChunk?.({ type: "text", content: `  ${o.id}. ${o.text}\n` });
      });
      onChunk?.({ type: "text", content: "\n" });
    });
    if (questions.length > 3) {
      onChunk?.({ type: "text", content: `...và ${questions.length - 3} câu nữa.\n\n` });
    }

    return { stepId: "generate-questions", success: true, output };
  },
};

const confirmStep: WorkflowStep = {
  id: "confirm-save",
  name: "Xác nhận lưu",
  async execute(state, session, ctx, onChunk) {
    const quiz = state.context.generatedQuiz as { count: number; topic: string };
    onChunk?.({ type: "text", content: `Bạn có muốn lưu bộ ${quiz.count} câu hỏi này không?\n` });

    const result = await toolRegistry.execute("ask-user-confirmation", {
      message: `Lưu bộ câu hỏi "${quiz.topic}" (${quiz.count} câu)?`,
    });

    const confirmed = (result.output as { confirmed: boolean })?.confirmed ?? false;
    state.context.shouldSave = confirmed;
    return { stepId: "confirm-save", success: true, output: { confirmed } };
  },
};

const saveStep: WorkflowStep = {
  id: "save-quiz",
  name: "Lưu bộ câu hỏi",
  async execute(state, session, ctx, onChunk) {
    if (!state.context.shouldSave) {
      onChunk?.({ type: "text", content: "Bỏ qua lưu theo yêu cầu.\n" });
      state.context.finalOutput = "Đã tạo quiz nhưng không lưu. Bạn có thể copy câu hỏi ở trên.";
      return { stepId: "save-quiz", success: true };
    }

    const quiz = state.context.generatedQuiz as { topic: string; questions: unknown[] };
    const result = await toolRegistry.execute("save-quiz", {
      title: quiz.topic ?? "Quiz mới",
      questions: quiz.questions,
    });

    if (!result.success) {
      return { stepId: "save-quiz", success: false, error: result.error };
    }

    const saved = result.output as { quizId: string; message: string };
    onChunk?.({ type: "text", content: `${saved.message}\n` });
    state.context.finalOutput = `${saved.message} Vào tab **Quiz** để bắt đầu làm bài!`;
    return { stepId: "save-quiz", success: true, output: saved };
  },
};

export const generateQuizWorkflow: WorkflowDefinition = {
  id: "generate-quiz",
  name: "Tạo Quiz từ tài liệu",
  description: "Pipeline tạo câu hỏi trắc nghiệm: tìm tài liệu → tạo quiz → xác nhận → lưu",
  steps: [searchStep, generateStep, confirmStep, saveStep],
  resumable: false,
};
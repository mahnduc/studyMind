// core/agent/workflows/definitions/study-session.workflow.ts
// MÔ TẢ: Workflow phiên học tập: tóm tắt → hỏi đáp → quiz ôn tập

import { WorkflowDefinition, WorkflowStep } from "../types";
import { toolRegistry } from "../../tools/registry";
import { providerRouter } from "../../providers/provider-router";
import { SYSTEM_PROMPT } from "../../prompts/system.prompt";

const summarizeStep: WorkflowStep = {
  id: "summarize-topic",
  name: "Tóm tắt chủ đề",
  async execute(state, session, ctx, onChunk) {
    const topic = state.context.userInput as string;
    onChunk?.({ type: "text", content: `📚 **Bắt đầu học: ${topic}**\n\n` });
    onChunk?.({ type: "text", content: "🔍 Đang tìm kiếm nội dung tài liệu...\n" });

    const searchResult = await toolRegistry.execute("search-knowledge-base", {
      query: topic,
      topK: 6,
    });

    const chunks = searchResult.success
      ? (searchResult.output as { chunks: Array<{ content: string }> })?.chunks ?? []
      : [];

    const context = chunks.map((c) => c.content).join("\n\n");
    state.context.topicContent = context;

    onChunk?.({ type: "text", content: "\n📖 **Tóm tắt nội dung:**\n\n" });

    const response = await providerRouter.stream(
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: context
            ? `Dựa vào nội dung tài liệu sau, hãy tóm tắt ngắn gọn chủ đề "${topic}":\n\n${context}`
            : `Tóm tắt ngắn gọn về chủ đề: "${topic}"`,
        },
      ],
      { temperature: 0.5, maxTokens: 1024 },
      onChunk
    );

    state.context.summary = response.content ?? "";
    onChunk?.({ type: "text", content: "\n\n" });
    return { stepId: "summarize-topic", success: true, output: response.content };
  },
};

const qaStep: WorkflowStep = {
  id: "qa-session",
  name: "Hỏi đáp kiến thức",
  async execute(state, session, ctx, onChunk) {
    onChunk?.({ type: "text", content: "❓ **Câu hỏi kiểm tra hiểu biết:**\n\n" });

    const topic = state.context.userInput as string;
    const content = state.context.topicContent as string;

    const response = await providerRouter.stream(
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Tạo 3 câu hỏi ngắn (không phải trắc nghiệm) để kiểm tra hiểu biết về "${topic}".
${content ? `Dựa trên nội dung: ${content.slice(0, 2000)}` : ""}
Format: đánh số 1. 2. 3. và để trống dòng giữa các câu.`,
        },
      ],
      { temperature: 0.6, maxTokens: 512 },
      onChunk
    );

    state.context.qaQuestions = response.content ?? "";
    onChunk?.({ type: "text", content: "\n\n💡 *Hãy suy nghĩ về các câu hỏi trên trước khi tiếp tục...*\n\n" });

    // Chờ người dùng xác nhận tiếp tục
    await toolRegistry.execute("ask-user-confirmation", {
      message: "Bạn đã sẵn sàng xem đáp án và làm quiz ôn tập?",
    });

    return { stepId: "qa-session", success: true, output: response.content };
  },
};

const quizStep: WorkflowStep = {
  id: "practice-quiz",
  name: "Quiz ôn tập",
  async execute(state, session, ctx, onChunk) {
    onChunk?.({ type: "text", content: "🎯 **Tạo quiz ôn tập...**\n\n" });

    const content = (state.context.topicContent as string) || (state.context.summary as string);

    const result = await toolRegistry.execute("generate-quiz", {
      content,
      questionCount: 5,
      difficulty: "mixed",
      topic: state.context.userInput as string,
    });

    if (!result.success) {
      onChunk?.({ type: "text", content: "⚠️ Không thể tạo quiz. Kết thúc phiên học.\n" });
      state.context.finalOutput = "Phiên học hoàn thành! Đã tóm tắt và hỏi đáp về chủ đề.";
      return { stepId: "practice-quiz", success: true };
    }

    const quiz = result.output as { questions: unknown[]; count: number };

    // Lưu quiz tự động
    await toolRegistry.execute("save-quiz", {
      title: `Ôn tập: ${state.context.userInput}`,
      questions: quiz.questions,
    });

    onChunk?.({ type: "text", content: `✅ Đã tạo và lưu ${quiz.count} câu hỏi ôn tập!\n\n` });
    onChunk?.({ type: "text", content: `🏁 **Phiên học hoàn thành!**\nVào tab **Quiz** để bắt đầu làm bài kiểm tra.\n` });

    state.context.finalOutput = `Phiên học "${state.context.userInput}" hoàn thành! Quiz ôn tập đã được lưu, vào tab Quiz để làm bài.`;
    return { stepId: "practice-quiz", success: true, output: quiz };
  },
};

export const studySessionWorkflow: WorkflowDefinition = {
  id: "study-session",
  name: "Phiên học tập có cấu trúc",
  description: "Tóm tắt chủ đề → hỏi đáp → quiz ôn tập",
  steps: [summarizeStep, qaStep, quizStep],
  resumable: false,
};
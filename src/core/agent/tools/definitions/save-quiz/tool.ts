// core/agent/tools/definitions/save-quiz/tool.ts
// MÔ TẢ: Tool lưu bộ câu hỏi vào storage

import { ToolDefinition } from "../../types";
import { quizRepository } from "../../../../quiz/repositories/quiz.repository";

export const saveQuizTool: ToolDefinition = {
  id: "save-quiz",
  name: "save_quiz",
  description:
    "Lưu bộ câu hỏi trắc nghiệm vào cơ sở dữ liệu để người dùng có thể làm lại sau. " +
    "Gọi sau khi generate_quiz nếu người dùng muốn lưu.",
  parameters: {
    title: {
      type: "string",
      description: "Tiêu đề của bộ câu hỏi",
      required: true,
    },
    questions: {
      type: "array",
      description: "Mảng câu hỏi từ kết quả generate_quiz",
      required: true,
    },
    sourceDocumentId: {
      type: "string",
      description: "ID tài liệu nguồn (nếu có)",
    },
  },
  requiredParameters: ["title", "questions"],
  hasSideEffects: true,

  async execute(input) {
    try {
      const quizId = await quizRepository.save({
        title: input.title as string,
        questions: input.questions as unknown[],
        sourceDocumentId: input.sourceDocumentId as string | undefined,
        createdAt: Date.now(),
      });

      return {
        success: true,
        output: {
          saved: true,
          quizId,
          message: `Đã lưu bộ câu hỏi "${input.title}" (${(input.questions as unknown[]).length} câu).`,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: `save-quiz thất bại: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};
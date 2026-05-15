// core/agent/tools/definitions/generate-quiz/tool.ts
// MÔ TẢ: Tool tạo câu hỏi trắc nghiệm từ nội dung

import { ToolDefinition } from "../../types";
import { quizGeneratorService } from "../../../../quiz/services/quiz-generator.service";

export const generateQuizTool: ToolDefinition = {
  id: "generate-quiz",
  name: "generate_quiz",
  description:
    "Tạo bộ câu hỏi trắc nghiệm từ nội dung được cung cấp. " +
    "Mỗi câu hỏi có 4 lựa chọn và giải thích đáp án đúng.",
  parameters: {
    content: {
      type: "string",
      description: "Nội dung văn bản dùng để tạo câu hỏi",
      required: true,
    },
    questionCount: {
      type: "number",
      description: "Số câu hỏi cần tạo (mặc định: 5)",
    },
    difficulty: {
      type: "string",
      description: "Độ khó: easy | medium | hard | mixed",
      enum: ["easy", "medium", "hard", "mixed"],
    },
    topic: {
      type: "string",
      description: "Chủ đề của bộ câu hỏi (dùng để đặt tên)",
    },
  },
  requiredParameters: ["content"],
  hasSideEffects: false,

  async execute(input) {
    try {
      const questions = await quizGeneratorService.generate({
        content: input.content as string,
        questionCount: (input.questionCount as number) ?? 5,
        difficulty: (input.difficulty as "easy" | "medium" | "hard" | "mixed") ?? "mixed",
        topic: input.topic as string | undefined,
      });

      return {
        success: true,
        output: {
          topic: input.topic ?? "Không có tiêu đề",
          questions,
          count: questions.length,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: `generate-quiz thất bại: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};
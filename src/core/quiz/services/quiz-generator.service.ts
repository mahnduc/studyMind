// core/quiz/services/quiz-generator.service.ts
// PHÂN LOẠI: Không phải xương sống
// MÔ TẢ: Gọi LLM để tạo câu hỏi trắc nghiệm từ nội dung

import { providerRouter } from "../../agent/providers/provider-router";
import { quizValidatorService } from "./quiz-validator.service";
import { GenerateQuizInput, Question, QuizOption } from "../types";
import { GROQ_MODELS } from "../../agent/providers/groq/types";

interface RawQuestion {
  content: string;
  options: Array<{ id: string; text: string }>;
  correctId: string;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export const quizGeneratorService = {
  async generate(input: GenerateQuizInput): Promise<Question[]> {
    const difficultyInstruction =
      input.difficulty === "mixed"
        ? `Tạo mix độ khó: ${Math.ceil(input.questionCount / 3)} câu dễ, ${Math.ceil(input.questionCount / 3)} câu trung bình, còn lại khó.`
        : `Tất cả câu hỏi ở mức độ: ${input.difficulty}.`;

    const prompt = `Tạo ${input.questionCount} câu hỏi trắc nghiệm từ nội dung sau.
${difficultyInstruction}

NỘI DUNG:
${input.content.slice(0, 6000)}

YÊU CẦU:
- Mỗi câu có đúng 4 lựa chọn (id: "a","b","c","d")
- Chỉ 1 đáp án đúng
- 3 lựa chọn sai phải hợp lý, gây nhầm lẫn
- Có giải thích ngắn cho đáp án đúng
- Câu hỏi phải bám sát nội dung, không sáng tác thêm

Trả về JSON array, KHÔNG có text nào khác:
[
  {
    "content": "Câu hỏi?",
    "options": [
      { "id": "a", "text": "..." },
      { "id": "b", "text": "..." },
      { "id": "c", "text": "..." },
      { "id": "d", "text": "..." }
    ],
    "correctId": "a",
    "explanation": "Giải thích ngắn...",
    "difficulty": "medium"
  }
]`;

    const response = await providerRouter.complete(
      [
        {
          role: "system",
          content:
            "Bạn là chuyên gia tạo câu hỏi trắc nghiệm. Chỉ trả về JSON hợp lệ.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      {
        model: GROQ_MODELS.LLAMA_3_3_70B,
        temperature: 0.4,
        maxTokens: 4096,
      }
    );

    // Parse kết quả từ LLM
    const rawQuestions = quizGeneratorService._parseResponse(
      response.content ?? ""
    );

    // Ép kiểu kết quả validate về RawQuestion[]
    // (validator của bạn đang trả về unknown[])
    const validated = quizValidatorService.validate(
      rawQuestions
    ) as RawQuestion[];

    const timestamp = Date.now();

    const questions: Question[] = validated.map((q, i): Question => ({
      id: `q_${timestamp}_${i}`,
      content: q.content,
      options: q.options as QuizOption[],
      correctId: q.correctId,
      explanation: q.explanation,
      difficulty:
        q.difficulty ??
        quizGeneratorService._inferDifficulty(
          input.difficulty,
          i,
          input.questionCount
        ),
    }));

    return questions;
  },

  _parseResponse(raw: string): RawQuestion[] {
    try {
      const clean = raw
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      const parsed: unknown = JSON.parse(clean);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed as RawQuestion[];
    } catch {
      console.error(
        "[QuizGeneratorService] Parse error:",
        raw.slice(0, 200)
      );
      return [];
    }
  },

  _inferDifficulty(
    mode: GenerateQuizInput["difficulty"],
    index: number,
    total: number
  ): Question["difficulty"] {
    if (mode !== "mixed") {
      return mode as Question["difficulty"];
    }

    const third = Math.ceil(total / 3);

    if (index < third) {
      return "easy";
    }

    if (index < third * 2) {
      return "medium";
    }

    return "hard";
  },
};
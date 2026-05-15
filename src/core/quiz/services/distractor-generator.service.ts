// FILE: core/quiz/services/distractor-generator.service.ts
// MÔ TẢ: Tạo các lựa chọn sai (distractors) hợp lý cho câu hỏi
//        Được gọi khi LLM tạo câu hỏi thiếu distractors chất lượng

import { providerRouter } from "../../agent/providers/provider-router";
import { QuizOption } from "../types";
import { GROQ_MODELS } from "../../agent/providers/groq/types";

export const distractorGeneratorService = {
  /**
   * Bổ sung thêm distractors cho một câu hỏi.
   * Dùng khi LLM chỉ tạo được ít hơn 3 lựa chọn sai.
   */
  async generate(
    question: string,
    correctAnswer: string,
    existingDistractors: string[],
    needed: number
  ): Promise<QuizOption[]> {
    if (needed <= 0) return [];

    const prompt = `Câu hỏi: "${question}"
Đáp án đúng: "${correctAnswer}"
Các lựa chọn sai đã có: ${existingDistractors.map((d) => `"${d}"`).join(", ")}

Tạo thêm ${needed} lựa chọn sai hợp lý, gây nhầm lẫn nhưng SAI.
Chỉ trả về JSON array of strings, không có text khác:
["lựa chọn sai 1", "lựa chọn sai 2"]`;

    try {
      const response = await providerRouter.complete(
        [
          { role: "system", content: "Chỉ trả về JSON array of strings." },
          { role: "user", content: prompt },
        ],
        { model: GROQ_MODELS.LLAMA_3_1_8B, temperature: 0.5, maxTokens: 256 }
      );

      const raw = (response.content ?? "")
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(raw) as string[];
      const ids = ["b", "c", "d", "e", "f"];

      return parsed.slice(0, needed).map((text, i) => ({
        id: ids[existingDistractors.length + i] ?? `opt_${i}`,
        text,
      }));
    } catch {
      // Fallback: trả về placeholder
      return Array.from({ length: needed }, (_, i) => ({
        id: `fallback_${i}`,
        text: `Lựa chọn ${existingDistractors.length + i + 1}`,
      }));
    }
  },
};
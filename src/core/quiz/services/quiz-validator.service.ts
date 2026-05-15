// core/quiz/services/quiz-validator.service.ts
// MÔ TẢ: Validate cấu trúc câu hỏi trắc nghiệm từ LLM output

interface RawQuestion {
  content?: unknown;
  options?: unknown;
  correctId?: unknown;
  explanation?: unknown;
  difficulty?: unknown;
}

export const quizValidatorService = {
  validate(raw: RawQuestion[]): Required<Pick<RawQuestion, "content" | "options" | "correctId">> & RawQuestion[] {
    if (!Array.isArray(raw)) return [] as never;

    return raw.filter((q) => {
      if (typeof q.content !== "string" || q.content.trim() === "") return false;
      if (!Array.isArray(q.options) || q.options.length < 2) return false;
      if (typeof q.correctId !== "string") return false;

      const optionIds = (q.options as Array<{ id: string }>).map((o) => o.id);
      if (!optionIds.includes(q.correctId)) return false;

      return true;
    }) as never;
  },

  isValidDifficulty(v: unknown): v is "easy" | "medium" | "hard" {
    return v === "easy" || v === "medium" || v === "hard";
  },
};
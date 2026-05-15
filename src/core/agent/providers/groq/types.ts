// core/agent/providers/groq/types.ts
// MÔ TẢ: Hằng số và kiểu dữ liệu riêng cho Groq provider

export const GROQ_MODELS = {
  /** Llama 3.3 70B - khuyến nghị cho production, cân bằng tốc độ/chất lượng */
  LLAMA_3_3_70B: "llama-3.3-70b-versatile",
  /** Llama 3.1 8B - nhanh, dùng cho classify/supervisor */
  LLAMA_3_1_8B: "llama-3.1-8b-instant",
  /** Llama 3.3 70B SpecDec - tốc độ cao */
  LLAMA_3_3_70B_SPECDEC: "llama-3.3-70b-specdec",
  /** Gemma 2 9B */
  GEMMA_2_9B: "gemma2-9b-it",
} as const;

export type GroqModel = (typeof GROQ_MODELS)[keyof typeof GROQ_MODELS];

export const GROQ_DEFAULT_MODEL: GroqModel = GROQ_MODELS.LLAMA_3_3_70B;

/** Model nhẹ dùng cho Supervisor (phân loại intent - không cần model mạnh) */
export const GROQ_SUPERVISOR_MODEL: GroqModel = GROQ_MODELS.LLAMA_3_1_8B;

export interface GroqConfig {
  apiKey: string;
  defaultModel?: GroqModel;
  supervisorModel?: GroqModel;
}
// core/agent/capabilities/definitions/direct/quiz-generation.capability.ts

import { CapabilityDefinition } from "../../types";
import { QUIZ_GENERATOR_PROMPT } from "../../../prompts/quiz-generator.prompt";

export const quizGenerationCapability: CapabilityDefinition = {
  id: "quiz-generation",
  name: "Tạo câu hỏi trắc nghiệm",
  description:
    "Tạo bộ câu hỏi trắc nghiệm từ tài liệu hoặc chủ đề người dùng chỉ định. " +
    "Dùng khi người dùng muốn ôn tập, kiểm tra kiến thức, hoặc tạo đề thi.",
  triggerExamples: [
    "Tạo câu hỏi trắc nghiệm về ...",
    "Tạo 10 câu hỏi từ tài liệu ...",
    "Tôi muốn ôn tập chủ đề ...",
    "Sinh đề thi về ...",
    "Tạo quiz về chương ...",
  ],
  defaultMode: "direct",
  allowedToolIds: [
    "search-knowledge-base",
    "load-document",
    "generate-quiz",
    "save-quiz",
  ],
  systemPromptOverride: QUIZ_GENERATOR_PROMPT,
  requiresApproval: false,
};
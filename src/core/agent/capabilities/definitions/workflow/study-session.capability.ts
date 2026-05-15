// core/agent/capabilities/definitions/workflow/study-session.capability.ts

import { CapabilityDefinition } from "../../types";

export const studySessionCapability: CapabilityDefinition = {
  id: "study-session",
  name: "Phiên học tập có cấu trúc",
  description:
    "Dẫn dắt người dùng qua một phiên học tập có cấu trúc: " +
    "tóm tắt tài liệu → trả lời câu hỏi → tạo quiz ôn tập → đánh giá kết quả. " +
    "Dùng khi người dùng muốn học một chủ đề bài bản từ đầu đến cuối.",
  triggerExamples: [
    "Hãy giúp tôi học về ...",
    "Tôi muốn bắt đầu học ...",
    "Dạy tôi về chủ đề ...",
    "Bắt đầu phiên học ...",
    "Học bài ...",
  ],
  defaultMode: "workflow",
  workflowId: "study-session",
  allowedToolIds: [
    "search-knowledge-base",
    "load-document",
    "generate-quiz",
    "save-quiz",
    "ask-user-confirmation",
  ],
  requiresApproval: false,
};
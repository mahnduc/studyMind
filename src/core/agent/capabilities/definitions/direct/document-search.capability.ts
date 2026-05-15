// FILE: core/agent/capabilities/definitions/direct/document-search.capability.ts
// MÔ TẢ: Capability tìm kiếm tài liệu nội bộ (RAG)

import { CapabilityDefinition } from "../../types";
import { DOCUMENT_SEARCH_PROMPT } from "../../../prompts/document-search.prompt";

export const documentSearchCapability: CapabilityDefinition = {
  id: "document-search",
  name: "Tìm kiếm tài liệu",
  description:
    "Tìm kiếm và trả lời câu hỏi dựa trên tài liệu nội bộ đã được upload. " +
    "Dùng khi người dùng hỏi về nội dung cụ thể trong tài liệu, " +
    "giải thích khái niệm, hoặc tóm tắt tài liệu.",
  triggerExamples: [
    "Tài liệu này nói gì về ...",
    "Tìm thông tin về ...",
    "Giải thích khái niệm ... trong tài liệu",
    "Tóm tắt nội dung chương ...",
    "Định nghĩa của ... là gì",
  ],
  defaultMode: "direct",
  allowedToolIds: ["search-knowledge-base", "load-document"],
  systemPromptOverride: DOCUMENT_SEARCH_PROMPT,
  requiresApproval: false,
};
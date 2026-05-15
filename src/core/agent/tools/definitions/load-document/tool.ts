// core/agent/tools/definitions/load-document/tool.ts
// MÔ TẢ: Tool đọc toàn bộ nội dung một tài liệu cụ thể

import { ToolDefinition } from "../../types";
import { knowledgeBaseRepository } from "../../../../knowledge/repositories/knowledge-base.repository";

export const loadDocumentTool: ToolDefinition = {
  id: "load-document",
  name: "load_document",
  description:
    "Đọc toàn bộ nội dung của một tài liệu cụ thể theo ID hoặc tên file. " +
    "Dùng khi cần xử lý toàn bộ nội dung tài liệu (tạo quiz, tóm tắt toàn bộ...).",
  parameters: {
    documentId: {
      type: "string",
      description: "ID của tài liệu",
    },
    documentName: {
      type: "string",
      description: "Tên file tài liệu (nếu không biết ID)",
    },
  },
  requiredParameters: [],
  hasSideEffects: false,

  async execute(input) {
    if (!input.documentId && !input.documentName) {
      return {
        success: false,
        error: "Cần cung cấp documentId hoặc documentName",
      };
    }

    try {
      const doc = input.documentId
        ? await knowledgeBaseRepository.getById(input.documentId as string)
        : await knowledgeBaseRepository.getByName(input.documentName as string);

      if (!doc) {
        return {
          success: false,
          error: `Không tìm thấy tài liệu: ${input.documentId ?? input.documentName}`,
        };
      }

      return {
        success: true,
        output: {
          documentId: doc.id,
          name: doc.name,
          content: doc.content,
          size: doc.content.length,
          uploadedAt: doc.uploadedAt,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: `load-document thất bại: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};
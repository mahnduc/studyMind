// FILE: core/agent/tools/definitions/search-knowledge-base/tool.ts
// MÔ TẢ: Tool tìm kiếm tài liệu nội bộ (hybrid RAG)

import { ToolDefinition } from "../../types";
import { hybridRetriever } from "../../../../knowledge/retrieval/hybrid-retriever";

export const searchKnowledgeBaseTool: ToolDefinition = {
  id: "search-knowledge-base",
  name: "search_knowledge_base",
  description:
    "Tìm kiếm thông tin trong cơ sở tri thức nội bộ. " +
    "Dùng khi cần tra cứu nội dung từ tài liệu đã được upload. " +
    "Trả về các đoạn văn bản liên quan nhất kèm tên tài liệu nguồn.",
  parameters: {
    query: {
      type: "string",
      description:
        "Câu truy vấn tìm kiếm. Nên là câu hỏi hoặc từ khóa cụ thể.",
      required: true,
    },
    topK: {
      type: "number",
      description: "Số đoạn văn bản trả về (mặc định: 5, tối đa: 10)",
    },
    knowledgeBaseId: {
      type: "string",
      description:
        "ID của knowledge base cụ thể (để trống = tìm trong tất cả)",
    },
  },
  requiredParameters: ["query"],
  hasSideEffects: false,

  async execute(input) {
    try {
      const results = await hybridRetriever.retrieve({
        query: input.query as string,
        topK: (input.topK as number) ?? 5,
        knowledgeBaseId: input.knowledgeBaseId as string | undefined,
      });

      if (results.length === 0) {
        return {
          success: true,
          output: {
            found: false,
            message: "Không tìm thấy thông tin liên quan trong tài liệu.",
            chunks: [],
          },
        };
      }

      return {
        success: true,
        output: {
          found: true,
          count: results.length,
          chunks: results.map((r) => ({
            content: r.content,
            source: r.documentName,
            score: r.score,
            chunkId: r.chunkId,
          })),
        },
      };
    } catch (err) {
      return {
        success: false,
        error: `search-knowledge-base thất bại: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};
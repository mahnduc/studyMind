// core/agent/capabilities/definitions/reasoning/complex-analysis.capability.ts

import { CapabilityDefinition } from "../../types";

export const complexAnalysisCapability: CapabilityDefinition = {
  id: "complex-analysis",
  name: "Phân tích phức tạp đa bước",
  description:
    "Phân tích, so sánh, tổng hợp thông tin từ nhiều nguồn tài liệu khác nhau. " +
    "Dùng khi câu hỏi cần nhiều bước suy luận: so sánh khái niệm, " +
    "tìm mối liên hệ, phân tích nguyên nhân-kết quả, hoặc tổng hợp kiến thức từ nhiều tài liệu.",
  triggerExamples: [
    "So sánh ... và ...",
    "Phân tích mối liên hệ giữa ...",
    "Tại sao ... lại ảnh hưởng đến ...",
    "Tổng hợp các quan điểm về ...",
    "Đánh giá ưu nhược điểm của ...",
  ],
  defaultMode: "reasoning",
  allowedToolIds: ["search-knowledge-base", "load-document"],
  requiresApproval: false,
};
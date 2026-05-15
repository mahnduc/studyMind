// core/agent/tools/bootstrap.ts
// MÔ TẢ: Đăng ký tất cả tools vào ToolRegistry

import { toolRegistry } from "./registry";
import { searchKnowledgeBaseTool } from "./definitions/search-knowledge-base/tool";
import { generateQuizTool } from "./definitions/generate-quiz/tool";
import { saveQuizTool } from "./definitions/save-quiz/tool";
import { loadDocumentTool } from "./definitions/load-document/tool";
import { askUserConfirmationTool } from "./definitions/ask-user-confirmation/tool";

export function bootstrapTools(): void {
  toolRegistry.registerMany([
    searchKnowledgeBaseTool,
    generateQuizTool,
    saveQuizTool,
    loadDocumentTool,
    askUserConfirmationTool,
  ]);
}
// FILE: core/agent/capabilities/bootstrap.ts
// PHÂN LOẠI: shell (file kết nối)
// MÔ TẢ: Đăng ký toàn bộ capabilities, executors, tools, workflows.
//        Đây là nơi DUY NHẤT biết về sự tồn tại của các module cụ thể.
//        Chỉnh sửa file này khi thêm/xóa tính năng.
//
// HƯỚNG DẪN:
// - Thêm capability mới: import + capabilityRegistry.register(...)
// - Thêm tool mới: import + toolRegistry.register(...)
// - Thêm workflow mới: import + workflowRegistry.register(...)
// - Thêm executor mới: import + executorRegistry.register(...)
// - KHÔNG chạm vào bất kỳ file xương sống nào

import { EventEmitter } from "../runtime/event-emitter";
import { capabilityRegistry } from "./registry";
import { toolRegistry } from "../tools/registry";
import { workflowRegistry } from "../workflows/workflow-registry";
import { executorRegistry } from "../executors/executor.registry";
import { providerRouter } from "../providers/provider-router";
import { Supervisor } from "../supervisor/supervisor";
import { HumanApprovalManager } from "../human/approval-manager";
import { AgentRuntime } from "../runtime/runtime";

// ── Import các capability cụ thể ──────────────────────────────
// (Thêm import khi tạo capability mới)
import { documentSearchCapability } from "./definitions/direct/document-search.capability";
import { quizGenerationCapability } from "./definitions/direct/quiz-generation.capability";
import { studySessionCapability } from "./definitions/workflow/study-session.capability";
import { complexAnalysisCapability } from "./definitions/reasoning/complex-analysis.capability";

// ── Import các tool cụ thể ────────────────────────────────────
import { searchKnowledgeBaseTool } from "../tools/definitions/search-knowledge-base/tool";
import { generateQuizTool } from "../tools/definitions/generate-quiz/tool";
import { saveQuizTool } from "../tools/definitions/save-quiz/tool";
import { loadDocumentTool } from "../tools/definitions/load-document/tool";
import { askUserConfirmationTool } from "../tools/definitions/ask-user-confirmation/tool";

// ── Import các executor ───────────────────────────────────────
import { directExecutor } from "../executors/direct-executor";
import { reasoningExecutor } from "../executors/reasoning-executor";
import { workflowExecutor } from "../executors/workflow-executor";

// ── Import Groq provider ──────────────────────────────────────
import { GroqProvider } from "../providers/groq/groq.client";
import { GROQ_SUPERVISOR_MODEL } from "../providers/groq/types";

// ── Import Workflow ──────────────────────────────────────
import { generateQuizWorkflow } from "../workflows/definitions/generate-quiz.workflow";
import { studySessionWorkflow } from "../workflows/definitions/study-session.workflow";

// ── Import Storage ──────────────────────────────────────
import { opfsAdapter } from "@/core/storage/opfs.adapter";
import { pgliteAdapter } from "@/core/storage/pglite.adapter";

const MIGRATION_001 = `
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '', size_bytes INTEGER NOT NULL DEFAULT 0,
  uploaded_at INTEGER NOT NULL, chunk_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', error_message TEXT
);
CREATE TABLE IF NOT EXISTS document_chunks (
  chunk_id TEXT PRIMARY KEY, document_id TEXT NOT NULL, document_name TEXT NOT NULL,
  content TEXT NOT NULL, chunk_index INTEGER NOT NULL,
  start_char INTEGER NOT NULL DEFAULT 0, end_char INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS chunk_embeddings (
  chunk_id TEXT PRIMARY KEY, document_id TEXT NOT NULL,
  vector TEXT NOT NULL, model TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON chunk_embeddings(document_id)
`;
 
const MIGRATION_002 = `
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, source_document_id TEXT,
  question_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY, quiz_id TEXT NOT NULL, content TEXT NOT NULL,
  options TEXT NOT NULL, correct_id TEXT NOT NULL, explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium', question_index INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY, quiz_id TEXT NOT NULL, score INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0, answers TEXT NOT NULL DEFAULT '{}',
  started_at INTEGER NOT NULL, finished_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id)
`;
 
const MIGRATION_003 = `
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY, title TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY, session_id TEXT NOT NULL, role TEXT NOT NULL,
  content TEXT NOT NULL, tool_name TEXT, tool_call_id TEXT, timestamp INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON chat_messages(session_id)
`;

export interface BootstrapConfig {
  groqApiKey?: string;
  supervisorSystemPrompt?: string;
  runtimeOptions?: {
    maxIterations?: number;
    streamingEnabled?: boolean;
    humanInTheLoop?: boolean;
    timeoutMs?: number;
  };
}

let _runtimeInstance: AgentRuntime | null = null;
let _globalGroqProvider: GroqProvider | null = null;
/**
 * Khởi tạo toàn bộ hệ thống agent.
 * Gọi một lần duy nhất khi ứng dụng khởi động.
 */
export async function bootstrapAgent(
  config: BootstrapConfig
): Promise<AgentRuntime> {
  if (_runtimeInstance) return _runtimeInstance;
 
  // 1. Storage
  await opfsAdapter.initialize();
  await pgliteAdapter.initialize();
  await pgliteAdapter.migrate(MIGRATION_001);
  await pgliteAdapter.migrate(MIGRATION_002);
  await pgliteAdapter.migrate(MIGRATION_003);
 
  // 2. Events
  const events = new EventEmitter();
 
  // 3. Provider
  const currentKey = config.groqApiKey || ""; 
  _globalGroqProvider = new GroqProvider(currentKey);
  providerRouter.register(_globalGroqProvider, true);
 
  // 4. Tools
  toolRegistry.registerMany([
    searchKnowledgeBaseTool,
    generateQuizTool,
    saveQuizTool,
    loadDocumentTool,
    askUserConfirmationTool,
  ]);
 
  // 5. Workflows
  workflowRegistry.registerMany([generateQuizWorkflow, studySessionWorkflow]);
 
  // 6. Executors
  executorRegistry.register(directExecutor);
  executorRegistry.register(reasoningExecutor);
  executorRegistry.register(workflowExecutor);
 
  // 7. Capabilities
  capabilityRegistry.registerMany([
    documentSearchCapability,
    quizGenerationCapability,
    studySessionCapability,
    complexAnalysisCapability,
  ]);
 
  // 8. Supervisor
  const supervisor = new Supervisor(_globalGroqProvider, {
    systemPrompt: config.supervisorSystemPrompt ?? "You are an intent classifier.",
    model: GROQ_SUPERVISOR_MODEL,
    temperature: 0.1,
  });
 
  // 9. ApprovalManager
  const approvalManager = new HumanApprovalManager(events);
 
  // 10. Runtime
  _runtimeInstance = new AgentRuntime({
    capabilityRegistry,
    executorRegistry,
    supervisor,
    approvalManager,
    events,
  });
 
  return _runtimeInstance;
}

export {
  capabilityRegistry,
  toolRegistry,
  workflowRegistry,
  executorRegistry,
  providerRouter,
};

export function updateAgentApiKey(newApiKey: string) {
  if (_globalGroqProvider) {
    _globalGroqProvider.updateToken(newApiKey); 
    return true;
  }
  return false;
}
// core/shared/constants/index.ts
// MÔ TẢ: Hằng số toàn cục của ứng dụng

/** localStorage keys */
export const STORAGE_KEYS = {
  GROQ_API_KEY: "groq_api_key",
  ACTIVE_SESSION_ID: "active_session_id",
  THEME: "theme",
} as const;

/** Giới hạn hệ thống */
export const LIMITS = {
  MAX_FILE_SIZE_MB: 20,
  MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024,
  MAX_CHUNK_SIZE: 800,
  MAX_QUIZ_QUESTIONS: 20,
  MIN_QUIZ_QUESTIONS: 1,
  MAX_CONTEXT_MESSAGES: 20,
  MAX_REASONING_ITERATIONS: 8,
} as const;

/** Các file type được chấp nhận */
export const ACCEPTED_FILE_TYPES = {
  extensions: [".pdf", ".md", ".markdown", ".txt"],
  mimeTypes: ["application/pdf", "text/markdown", "text/plain"],
  label: "PDF, Markdown, TXT",
} as const;

/** Session mặc định */
export const DEFAULT_SESSION_ID = "default-session";

/** Routes */
export const ROUTES = {
  CHAT: "/chat",
  KNOWLEDGE: "/knowledge",
  QUIZ: "/quiz",
  SETTINGS: "/settings",
} as const;

/** Tab labels */
export const TAB_LABELS = {
  chat: "Chat",
  knowledge: "Tài liệu",
  quiz: "Quiz",
  settings: "Cài đặt",
} as const;
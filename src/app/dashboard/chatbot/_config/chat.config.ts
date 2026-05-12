// _config/chat.config.ts

export const CHAT_CONFIG = {
  model: 'llama-3.3-70b-versatile',
  maxHistory: 8,
  timeoutMs: 30000,
  maxTokens: 4096,
  temperature: 0.2,
  topP: 0.95,
} as const;
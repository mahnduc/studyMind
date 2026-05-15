// core/shared/types/index.ts
// MÔ TẢ: Shared TypeScript types dùng chung toàn ứng dụng

/** Tab navigation */
export type AppTab = "chat" | "knowledge" | "quiz" | "settings";

/** Theme */
export type Theme = "light" | "dark" | "system";

/** Trạng thái async chung */
export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
}

/** Paginated response */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Kết quả thao tác */
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
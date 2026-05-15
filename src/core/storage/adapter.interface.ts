// FILE: core/storage/adapter.interface.ts
// PHÂN LOẠI: Kernel (storage layer)
// MÔ TẢ: Interface trừu tượng cho storage adapter
//        Repositories chỉ phụ thuộc vào interface này

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

export interface StorageAdapter {
  /**
   * Thực thi câu SQL với parameters
   */
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<T>>;

  /**
   * Thực thi SQL không cần kết quả (INSERT/UPDATE/DELETE/CREATE)
   */
  exec(sql: string, params?: unknown[]): Promise<void>;

  /**
   * Thực thi nhiều câu SQL trong một transaction
   */
  transaction(fn: (adapter: StorageAdapter) => Promise<void>): Promise<void>;

  /**
   * Chạy migration SQL files
   */
  migrate(sql: string): Promise<void>;

  /**
   * Khởi tạo adapter (mở kết nối, tạo tables nếu chưa có)
   */
  initialize(): Promise<void>;

  /**
   * Đóng kết nối
   */
  close(): Promise<void>;

  readonly isReady: boolean;
}
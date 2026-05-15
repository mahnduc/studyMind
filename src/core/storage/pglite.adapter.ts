// core/storage/pglite.adapter.ts
// MÔ TẢ: PGlite adapter - PostgreSQL chạy trong browser qua WASM + OPFS
//        Dùng thư viện @electric-sql/pglite

import { StorageAdapter, QueryResult } from "./adapter.interface";

// Dynamic import để tránh SSR issues với NextJS static export
type PGliteInstance = {
  query: <T>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
  exec: (sql: string) => Promise<void>;
  close: () => Promise<void>;
};

export class PGliteAdapter implements StorageAdapter {
  private db: PGliteInstance | null = null;
  private _isReady = false;
  private readonly dataDir: string;

  constructor(dataDir = "idb://agent-db") {
    this.dataDir = dataDir;
  }

  get isReady(): boolean {
    return this._isReady;
  }

  async initialize(): Promise<void> {
    if (this._isReady) return;

    // Dynamic import - chỉ chạy ở browser
    const { PGlite } = await import("@electric-sql/pglite");
    this.db = new PGlite(this.dataDir) as unknown as PGliteInstance;
    this._isReady = true;
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult<T>> {
    this._assertReady();
    const result = await this.db!.query<T>(sql, params);
    return {
      rows: result.rows,
      rowCount: result.rows.length,
    };
  }

  async exec(sql: string, params: unknown[] = []): Promise<void> {
    this._assertReady();
    if (params.length > 0) {
      await this.db!.query(sql, params);
    } else {
      await this.db!.exec(sql);
    }
  }

  async transaction(
    fn: (adapter: StorageAdapter) => Promise<void>
  ): Promise<void> {
    this._assertReady();
    await this.exec("BEGIN");
    try {
      await fn(this);
      await this.exec("COMMIT");
    } catch (err) {
      await this.exec("ROLLBACK");
      throw err;
    }
  }

  async migrate(sql: string): Promise<void> {
    this._assertReady();
    // Chạy từng statement riêng biệt
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      await this.exec(stmt);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this._isReady = false;
    }
  }

  private _assertReady(): void {
    if (!this._isReady || !this.db) {
      throw new Error(
        "[PGliteAdapter] Adapter chưa được khởi tạo. Gọi initialize() trước."
      );
    }
  }
}

// Singleton
export const pgliteAdapter = new PGliteAdapter();
// core/storage/opfs.adapter.ts
// MÔ TẢ: OPFS (Origin Private File System) adapter - lưu file nhị phân
//        Dùng để lưu file PDF gốc, không dùng cho SQL queries

export class OPFSAdapter {
  private root: FileSystemDirectoryHandle | null = null;
  private readonly baseDir: string;

  constructor(baseDir = "agent-files") {
    this.baseDir = baseDir;
  }

  async initialize(): Promise<void> {
    if (!("storage" in navigator && "getDirectory" in navigator.storage)) {
      throw new Error("[OPFSAdapter] OPFS không được hỗ trợ trong môi trường này");
    }
    const opfsRoot = await navigator.storage.getDirectory();
    this.root = await opfsRoot.getDirectoryHandle(this.baseDir, {
      create: true,
    });
  }

  private assertReady(): void {
    if (!this.root) {
      throw new Error("[OPFSAdapter] Chưa khởi tạo. Gọi initialize() trước.");
    }
  }

  /** Lưu file vào OPFS */
  async writeFile(fileName: string, data: ArrayBuffer | Uint8Array): Promise<void> {
    this.assertReady();
    const fileHandle = await this.root!.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data as any);
    await writable.close();
  }

  /** Đọc file từ OPFS */
  async readFile(fileName: string): Promise<ArrayBuffer> {
    this.assertReady();
    const fileHandle = await this.root!.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return file.arrayBuffer();
  }

  /** Kiểm tra file tồn tại */
  async exists(fileName: string): Promise<boolean> {
    this.assertReady();
    try {
      await this.root!.getFileHandle(fileName);
      return true;
    } catch {
      return false;
    }
  }

  /** Xóa file */
  async deleteFile(fileName: string): Promise<void> {
    this.assertReady();
    await this.root!.removeEntry(fileName);
  }

  /** Liệt kê tất cả files */
  async listFiles(): Promise<string[]> {
    this.assertReady();
    const names: string[] = [];
    for await (const [name] of this.root! as unknown as AsyncIterable<[string, FileSystemHandle]>) {
      names.push(name);
    }
    return names;
  }

  /** Lưu text file */
  async writeText(fileName: string, content: string): Promise<void> {
    const encoded = new TextEncoder().encode(content);
    await this.writeFile(fileName, encoded);
  }

  /** Đọc text file */
  async readText(fileName: string): Promise<string> {
    const buffer = await this.readFile(fileName);
    return new TextDecoder().decode(buffer);
  }
}

// Singleton
export const opfsAdapter = new OPFSAdapter();
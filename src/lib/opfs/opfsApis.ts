// libs/opfs/api/api.ts
import { opfsService } from './services/opfs.service';

export const opfsApi = {
  // --- NHÓM THAO TÁC NỘI DUNG ---

  /** Ghi văn bản hoặc dữ liệu vào tệp */
  async save(path: string, content: string | Blob | BufferSource): Promise<void> {
    await opfsService.write(path, content);
  },

  /** Đọc nội dung tệp dưới dạng văn bản (txt, md, json) */
  async readAsText(path: string): Promise<string> {
    const file = await opfsService.read(path);
    return await file.text();
  },

  /** Đọc và parse JSON */
  async readAsJson<T>(path: string): Promise<T> {
    const text = await this.readAsText(path);
    return JSON.parse(text) as T;
  },

  /** Lấy URL blob để hiển thị ảnh/video */
  async getFileURL(path: string): Promise<string> {
    const file = await opfsService.read(path);
    return URL.createObjectURL(file);
  },

  // --- NHÓM DUYỆT & THÔNG TIN (EXPLORER CORE) ---

  /** Lấy danh sách tệp/thư mục trong một đường dẫn */
  async listContents(path: string) {
    return await opfsService.list(path);
  },

  /** Lấy toàn bộ cây thư mục để render Sidebar Tree */
  async getTree(rootPath: string = '/') {
    return await opfsService.tree(rootPath);
  },

  /** Kiểm tra sự tồn tại */
  async exists(path: string): Promise<boolean> {
    return await opfsService.exists(path);
  },

  /** Lấy thông tin chi tiết (size, date, type) */
  async getStat(path: string) {
    return await opfsService.getMetadata(path);
  },

  // --- NHÓM BIẾN ĐỔI CẤU TRÚC ---

  /** Tạo thư mục mới */
  async createFolder(path: string): Promise<void> {
    await opfsService.mkdir(path);
  },

  /** Tạo tệp trống */
  async createEmptyFile(path: string): Promise<void> {
    await opfsService.touch(path);
  },

  /** Đổi tên tệp hoặc thư mục */
  async rename(oldPath: string, newName: string): Promise<void> {
    await opfsService.rename(oldPath, newName);
  },

  /** Di chuyển tệp/thư mục đến vị trí mới */
  async move(sourcePath: string, destDirPath: string): Promise<void> {
    await opfsService.moveTo(sourcePath, destDirPath);
  },

  /** Sao chép tệp/thư mục */
  async copy(sourcePath: string, destDirPath: string): Promise<void> {
    await opfsService.copyTo(sourcePath, destDirPath);
  },

  /** Xóa vĩnh viễn */
  async delete(path: string, recursive = true): Promise<void> {
    await opfsService.remove(path, recursive);
  },

  // --- NHÓM HỆ THỐNG ---

  // Tìm kiếm tệp theo tên
  async search(query: string, root: string = '/') {
    return await opfsService.search(query, root);
  },

  // Lấy thông tin dung lượng bộ nhớ trình duyệt
  async getStorageInfo() {
    return await opfsService.getCapacity();
  },
  // Lấy đường dẫn thư mục
  async getFilePath(path: string): Promise<string> {
    return await opfsService.getFilePath(path);
  },
};

export type OpfsApi = typeof opfsApi;
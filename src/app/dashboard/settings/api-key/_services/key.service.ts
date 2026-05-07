import { toast } from 'react-toastify';

export type KeysSchema = Record<string, string[]>;

const SECRET_FILENAME = "keys.json";
const SECRET_DIRECTORY = "system-secrets";

const createKeyService = () => {
  /**
   * Truy cập File Handle từ Origin Private File System (OPFS)
   */
  const getSecretsFileHandle = async (create = false): Promise<FileSystemFileHandle> => {
    const root = await navigator.storage.getDirectory();
    const dirHandle = await root.getDirectoryHandle(SECRET_DIRECTORY, { create });
    return await dirHandle.getFileHandle(SECRET_FILENAME, { create });
  };

  /**
   * Kiểm tra tính hợp lệ của API Key bằng cách gọi thử endpoint của Provider
   */
  const validateKey = async (provider: string, key: string): Promise<boolean> => {
    if (!key?.trim()) return false;

    const endpoints: Record<string, string> = {
      groq: "https://api.groq.com/openai/v1/models",
    };

    const url = endpoints[provider];
    if (!url) return false;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${key}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  return {
    /**
     * Tải dữ liệu JSON từ OPFS
     */
    async load(): Promise<KeysSchema> {
      try {
        const fileHandle = await getSecretsFileHandle();
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        if (!content) return {};
        return JSON.parse(content) as KeysSchema;
      } catch (err) {
        // Trả về object rỗng nếu file chưa tồn tại hoặc lỗi định dạng
        return {};
      }
    },

    /**
     * Lưu đối tượng KeysSchema thành file JSON
     */
    async save(data: KeysSchema): Promise<void> {
      try {
        const fileHandle = await getSecretsFileHandle(true);
        
        // Tạo writable stream (Hỗ trợ tốt trên Chrome/Edge)
        // @ts-ignore: createWritable có thể không tồn tại trong một số định nghĩa TS cũ
        const writable = await fileHandle.createWritable();
        
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
      } catch (err) {
        console.error("OPFS Save Error:", err);
        throw new Error("Lỗi: Không thể ghi dữ liệu vào bộ nhớ trình duyệt.");
      }
    },

    /**
     * Thêm key mới sau khi validate
     */
    async add(provider: string, key: string): Promise<void> {
      const trimmedKey = key.trim();
      if (!trimmedKey) throw new Error("API key không được để trống.");
      
      const isValid = await validateKey(provider, trimmedKey);
      if (!isValid) throw new Error(`API key cho ${provider} không hợp lệ.`);

      const data = await this.load();
      
      // Khởi tạo mảng nếu provider chưa tồn tại
      if (!data[provider]) {
        data[provider] = [];
      }

      if (data[provider].includes(trimmedKey)) {
        throw new Error("API key này đã tồn tại trong hệ thống.");
      }

      data[provider].push(trimmedKey);
      await this.save(data);
    },

    /**
     * Xóa một key cụ thể
     */
    async remove(provider: string, key: string): Promise<void> {
      const data = await this.load();
      if (!data[provider]) return;

      data[provider] = data[provider].filter((k) => k !== key);
      
      // Xóa luôn provider nếu không còn key nào
      if (data[provider].length === 0) {delete data[provider];}
      await this.save(data);
    },

    async getProviders(): Promise<string[]> {
      const data = await this.load();
      return Object.keys(data);
    },

    async getKeys(provider: string): Promise<string[]> {
      const data = await this.load();
      return data[provider] || [];
    },

    async getRandomKey(provider: string): Promise<string | null> {
      const keys = await this.getKeys(provider);
      if (!keys || keys.length === 0) {throw new Error(`MISSING_KEY_${provider.toUpperCase()}`);}
      const randomIndex = Math.floor(Math.random() * keys.length);
      return keys[randomIndex];
    }

  };
};

export const keyService = createKeyService();
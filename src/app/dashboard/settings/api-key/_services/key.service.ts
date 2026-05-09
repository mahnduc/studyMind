import { throwError } from "@/lib/error/error";

export type KeysSchema = Record<string, string[]>;

const SECRET_FILENAME = "keys.json";
const SECRET_DIRECTORY = "system-secrets";

const createKeyService = () => {
  /**
   * Helper: Truy cập nhanh vào OPFS File Handle
   */
  const getFileHandle = async (create = false) => {
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle(SECRET_DIRECTORY, { create });
    return await dir.getFileHandle(SECRET_FILENAME, { create });
  };

  /**
   * Helper: Validate API Key (Mở rộng dễ dàng qua Record)
   */
  const validateKey = async (provider: string, key: string): Promise<boolean> => {
    if (!key.trim()) return false;
    
    const endpoints: Record<string, string> = {
      groq: "https://api.groq.com/openai/v1/models",
    };

    const url = endpoints[provider];
    if (!url) return false;

    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
      return res.ok;
    } catch {
      return false;
    }
  };

  return {
    async load(): Promise<KeysSchema> {
      try {
        const handle = await getFileHandle();
        const file = await handle.getFile();
        const content = await file.text();
        return content ? JSON.parse(content) : {};
      } catch {
        return {};
      }
    },

    async save(data: KeysSchema): Promise<void> {
      try {
        const handle = await getFileHandle(true);
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
      } catch (err) {
        throw new Error("Lưu thất bại: Không thể ghi vào hệ thống file trình duyệt.");
      }
    },

    async add(provider: string, key: string): Promise<void> {
      const trimmedKey = key.trim();
      if (!(await validateKey(provider, trimmedKey))) {
        throw new Error(`API key cho ${provider} không hợp lệ hoặc bị trống.`);
      }

      const data = await this.load();
      const currentKeys = data[provider] ?? [];

      if (currentKeys.includes(trimmedKey)) {
        throw new Error("API key đã tồn tại.");
      }

      await this.save({ 
        ...data, 
        [provider]: [...currentKeys, trimmedKey] 
      });
    },

    async remove(provider: string, key: string): Promise<void> {
      const data = await this.load();
      if (!data[provider]) return;

      const filtered = data[provider].filter((k) => k !== key);
      
      if (filtered.length > 0) {
        data[provider] = filtered;
      } else {
        delete data[provider];
      }
      
      await this.save(data);
    },

    async getProviders(): Promise<string[]> {
      return Object.keys(await this.load());
    },

    async getKeys(provider: string): Promise<string[]> {
      return (await this.load())[provider] ?? [];
    },

    async getRandomKey(provider: string): Promise<string> {
      const keys = await this.getKeys(provider);
      if (!keys.length) {
        throwError('NOT_FOUND_KEY', "Không tìm thấy Api Key. Xem hướng dẫn cấu hình api key tại [đây](/guide)")
      }
      return keys[Math.floor(Math.random() * keys.length)];
    }

  };
};

export const keyService = createKeyService();
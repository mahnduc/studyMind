import { OpfsServiceType, HandleGetter, allActions } from './types';

// Xử lý lỗi tập chung
const withError = <T>(promise: Promise<T>, message: string): Promise<T> => 
  promise.catch((err) => {
    throw new Error(`${message} -> ${err.message}`);
  });

export const createOpfsService = (): OpfsServiceType => {
  let rootPromise: Promise<FileSystemDirectoryHandle> | null = null;

  const getRoot = () => {
    if (typeof navigator.storage?.getDirectory !== 'function') {
      throw new Error("OPFS is not supported in this environment.");
    }
    return (rootPromise ??= navigator.storage.getDirectory());
  };

  const _getHandle: HandleGetter = async (path, create = false) => {
  const root = await getRoot();
  
  const parts = path.split("/").filter(Boolean);

  if (parts.length === 0) {
    return { currentDir: root, fileName: "" }; 
  }

  const fileName = parts.pop()!;
  let currentDir = root;

  for (const part of parts) { 
    currentDir = await currentDir.getDirectoryHandle(part, { create });
  }
    return { currentDir, fileName };
  };

  // Tạo API động bằng cách quét qua allActions
  const dynamicApi = Object.keys(allActions).reduce((api, key) => {
    const actionFn = (allActions as any)[key];
    
    (api as any)[key] = (...args: any[]) => {
      const promise = actionFn(_getHandle, ...args);
      return withError(promise, `OPFS_${key.toUpperCase()} failed: ${args[0]}`);
    };
    
    return api;
  }, {} as any);

  return Object.freeze({
    ...dynamicApi,
  }) as OpfsServiceType;
};

export const opfsService = createOpfsService();
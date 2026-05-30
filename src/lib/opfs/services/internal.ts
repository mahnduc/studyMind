// libs/opfs/services/internal.ts
import { HandleGetter, GetHandleResult } from './types';

const _resolve = async (
  getHandle: HandleGetter,
  path: string,
  create: boolean = false
): Promise<GetHandleResult> => {
  return await getHandle(path, create);
};

// --- NHÓM 1: TRA CỨU & DUYỆT (Navigation & Discovery) ---
export const exists = async (getHandle: HandleGetter, path: string): Promise<boolean> => {
  try {
    const { currentDir, fileName } = await getHandle(path);

    if (!fileName) return true;

    try {
      await currentDir.getDirectoryHandle(fileName);
      return true;
    } catch {
      try {
        await currentDir.getFileHandle(fileName);
        return true;
      } catch {
        return false;
      }
    }
  } catch {
    return false;
  }
};

export const list = async (getHandle: HandleGetter, path: string) => {
  const targetPath = path.endsWith('/') ? `${path}._` : `${path}/._`;
  const { currentDir } = await _resolve(getHandle, targetPath);
  
  const entries: { name: string; kind: 'file' | 'directory'; path: string }[] = [];
  const cleanPath = path.replace(/\/$/, '') || '';

  for await (const [name, handle] of (currentDir as any).entries()) {
    entries.push({
      name,
      kind: handle.kind,
      path: `${cleanPath}/${name}`.replace(/\/+/g, '/')
    });
  }
  return entries;
};

export const getMetadata = async (getHandle: HandleGetter, path: string) => {
  const { currentDir, fileName } = await _resolve(getHandle, path);
  const fileHandle = await currentDir.getFileHandle(fileName);
  const file = await fileHandle.getFile();
  
  return {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    type: file.type,
    kind: 'file' as const
  };
};

export const tree = async (getHandle: HandleGetter, path: string = '/'): Promise<any[]> => {
  const entries = await list(getHandle, path);
  const result = [];

  for (const entry of entries) {
    if (entry.kind === 'directory') {
      result.push({
        ...entry,
        children: await tree(getHandle, entry.path)
      });
    } else {
      result.push(entry);
    }
  }
  return result;
};

// --- NHÓM 2: THAO TÁC CƠ BẢN (Core I/O) ---
export const write = async (
  getHandle: HandleGetter, 
  path: string, 
  data: string | Blob | BufferSource
): Promise<void> => {
  const { currentDir, fileName } = await _resolve(getHandle, path, true);
  const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
};

export const read = async (getHandle: HandleGetter, path: string): Promise<File> => {
  const { currentDir, fileName } = await _resolve(getHandle, path);
  const fileHandle = await currentDir.getFileHandle(fileName);
  return await fileHandle.getFile();
};

export const touch = async (getHandle: HandleGetter, path: string): Promise<void> => {
  const { currentDir, fileName } = await _resolve(getHandle, path, true);
  await currentDir.getFileHandle(fileName, { create: true });
};

export const mkdir = async (getHandle: HandleGetter, path: string): Promise<void> => {
  await _resolve(getHandle, `${path}/._`, true);
};

// --- NHÓM 3: BIẾN ĐỔI CẤU TRÚC (Structural Modification) ---
export const remove = async (
  getHandle: HandleGetter, 
  path: string, 
  recursive = true
): Promise<void> => {
  const { currentDir, fileName } = await _resolve(getHandle, path);
  await currentDir.removeEntry(fileName, { recursive });
};

export const rename = async (getHandle: HandleGetter, oldPath: string, newName: string): Promise<void> => {
  const file = await read(getHandle, oldPath);
  const pathParts = oldPath.split('/').filter(Boolean);
  pathParts.pop(); // Bỏ tên cũ
  const parentPath = pathParts.join('/');
  const newPath = parentPath ? `${parentPath}/${newName}` : `/${newName}`;
  
  await write(getHandle, newPath, file);
  await remove(getHandle, oldPath);
};

export const moveTo = async (getHandle: HandleGetter, sourcePath: string, destDirPath: string): Promise<void> => {
  const file = await read(getHandle, sourcePath);
  const fileName = sourcePath.split('/').pop()!;
  const newPath = `${destDirPath.replace(/\/$/, '')}/${fileName}`;
  
  await write(getHandle, newPath, file);
  await remove(getHandle, sourcePath);
};

export const copyTo = async (getHandle: HandleGetter, sourcePath: string, destDirPath: string): Promise<void> => {
  const file = await read(getHandle, sourcePath);
  const fileName = sourcePath.split('/').pop()!;
  const newPath = `${destDirPath.replace(/\/$/, '')}/${fileName}`;
  
  await write(getHandle, newPath, file);
};


// --- NHÓM 4: TIỆN ÍCH HỆ THỐNG (System Utilities) ---
export const search = async (getHandle: HandleGetter, query: string, root: string = '/'): Promise<any[]> => {
  const allFiles: any[] = [];
  const flatScan = async (path: string) => {
    const entries = await list(getHandle, path);
    for (const entry of entries) {
      if (entry.name.toLowerCase().includes(query.toLowerCase())) {
        allFiles.push(entry);
      }
      if (entry.kind === 'directory') {
        await flatScan(entry.path);
      }
    }
  };
  await flatScan(root);
  return allFiles;
};

export const getCapacity = async () => {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percent: estimate.usage && estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
    };
  }
  return { usage: 0, quota: 0, percent: 0 };
};

export const getFilePath = async (
  getHandle: HandleGetter,
  path: string
): Promise<string> => {
  const { fileName } = await getHandle(path, false);
  const { currentDir } = await getHandle(path, false);
  if (fileName) {
    await currentDir.getFileHandle(fileName, { create: false });
  }

  return path.split("/").filter(Boolean).join("/");
};
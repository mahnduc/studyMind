import { useState, useEffect, useCallback } from "react";

export function useOPFSFiles(directoryName: string = "system-raw-file") {
  const [files, setFiles] = useState<{ name: string; handle: FileSystemFileHandle }[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFilesFromOPFS = useCallback(async () => {
    setLoading(true);
    try {
      const root = await navigator.storage.getDirectory();
      const workspaceHandle = await root.getDirectoryHandle(directoryName, { create: true });
      
      const fileList: { name: string; handle: FileSystemFileHandle }[] = [];

      for await (const entry of workspaceHandle.values()) {
        if (entry.kind === "file") {
          fileList.push({ name: entry.name, handle: entry as FileSystemFileHandle });
        }
      }
      setFiles(fileList);
    } catch (error) {
      console.error("Lỗi khi truy cập OPFS:", error);
    } finally {
      setLoading(false);
    }
  }, [directoryName]);

  useEffect(() => {
    loadFilesFromOPFS();
  }, [loadFilesFromOPFS]);

  const deleteFile = async (name: string, e: React.MouseEvent, onDeleted?: () => void) => {
    e.stopPropagation();
    if (!confirm(`Xóa file ${name}?`)) return;
    try {
      const root = await navigator.storage.getDirectory();
      const workspaceHandle = await root.getDirectoryHandle(directoryName);
      await workspaceHandle.removeEntry(name);
      
      await loadFilesFromOPFS();
      if (onDeleted) onDeleted();
    } catch (error) {
      console.error("Lỗi xóa file:", error);
    }
  };

  return {
    files,
    loading,
    refreshFiles: loadFilesFromOPFS,
    deleteFile,
  };
}
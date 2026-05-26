"use client";

import { ingestFromPath } from "@/lib/rag/api";
import { useState, useRef, useEffect } from "react";

export function useCreateCourse() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [files, setFiles] = useState<{ name: string; handle: FileSystemFileHandle }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFilesFromOPFS = async () => {
    setLoading(true);
    try {
      const root = await navigator.storage.getDirectory();
      const workspaceHandle = await root.getDirectoryHandle("my-workspace", { create: true });
      
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
  };

  useEffect(() => {
    loadFilesFromOPFS();
  }, []);

  function sanitizeFileName(fileName: string): string {
    const baseNameWithExt = fileName.split(/[/\\]/).pop() || fileName;
    
    // 2. Tách tên và đuôi file (ví dụ: "Báo cáo_2026.docx" -> name: "Báo cáo_2026", ext: ".docx")
    const lastDotIndex = baseNameWithExt.lastIndexOf('.');
    const ext = lastDotIndex !== -1 ? baseNameWithExt.substring(lastDotIndex) : '';
    let nameWithoutExt = lastDotIndex !== -1 ? baseNameWithExt.substring(0, lastDotIndex) : baseNameWithExt;

    // 3. Chuyển đổi tiếng Việt có dấu thành không dấu
    nameWithoutExt = nameWithoutExt
      .normalize("NFD") // Tách các dấu tiếng Việt ra khỏi chữ cái gốc
      .replace(/[\u0300-\u036f]/g, "") // Xóa bỏ các ký tự dấu vừa tách
      .replace(/đ/g, "d") // Thay thế chữ đ thường
      .replace(/Đ/g, "D"); // Thay thế chữ Đ hoa

    const cleanName = nameWithoutExt
      .replace(/[^a-zA-Z0-9-_\s]/g, "") // Xóa hết ký tự lạ ngoại trừ chữ, số, -, _, khoảng trắng
      .trim()
      .replace(/\s+/g, "-"); // Biến khoảng trắng thành dấu gạch ngang (-) cho đẹp

    return `${cleanName}${ext.toLowerCase()}`;
  }

  // 2. Cập nhật lại hàm handleFileUpload của bạn
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const root = await navigator.storage.getDirectory();
      const workspaceHandle = await root.getDirectoryHandle("my-workspace", { create: true });
      const safeFileName = sanitizeFileName(file.name);
      const fileHandle = await workspaceHandle.getFileHandle(safeFileName, { create: true });
      const writable = await fileHandle.createWritable();
      
      await writable.write(file);
      await writable.close();

      await loadFilesFromOPFS();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Lỗi upload:", error);
    }
  };

  const deleteFile = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Xóa file ${name}?`)) return;
    try {
      const root = await navigator.storage.getDirectory();
      const workspaceHandle = await root.getDirectoryHandle("my-workspace");
      await workspaceHandle.removeEntry(name);
      if (selectedFile === name) setSelectedFile(null);
      await loadFilesFromOPFS();
    } catch (error) {
      console.error("Lỗi xóa file:", error);
    }
  };

  const handleConfirmIngestion = async () => {
    if (!selectedFile) return;

    setIsIngesting(true);
    try {
      const filePath = `my-workspace/${selectedFile}`;
      
      const response = await ingestFromPath(filePath);
      if (response.success) {
        alert(response.message);
      } else {
        alert("Lỗi: " + response.error);
      }
      
    } catch (error: any) {
      alert("Lỗi: " + (error?.message || "Không thể xử lý dữ liệu."));
    } finally {
      setIsIngesting(false);
    }
  };

  const handleSelectFile = (fileName: string) => {
    if (isIngesting) return;
    setSelectedFile(selectedFile === fileName ? null : fileName);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return {
    files,
    loading,
    isIngesting,
    selectedFile,
    fileInputRef,
    triggerFileInput,
    handleFileUpload,
    handleSelectFile,
    deleteFile,
    handleConfirmIngestion,
  };
}
import { useRef } from "react";
import { MAX_FILE_SIZE_MB } from "@/utils/constant";
import { convertToHtml } from "mammoth";
import TurndownService from "turndown";

interface UseUploadOptions {
  directoryName?: string;
  onUploadSuccess?: (info: { originalType: string; savedFileName: string; savedPath: string }) => void;
}

async function convertDocxFileToMdContent(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  const result = await convertToHtml({ arrayBuffer });
  const htmlContent = result.value; 

  const turndownService = new TurndownService({
    headingStyle: "atx", 
    hr: "---",
    bulletListMarker: "*",
    strongDelimiter: "**",
    emDelimiter: "_"
  });
  
  return turndownService.turndown(htmlContent);
}

export function useUploadToOPFS({ directoryName = "system-raw-file", onUploadSuccess }: UseUploadOptions = {}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function sanitizeFileName(fileName: string): string {
    const baseNameWithExt = fileName.split(/[/\\]/).pop() || fileName;
    const lastDotIndex = baseNameWithExt.lastIndexOf('.');
    const ext = lastDotIndex !== -1 ? baseNameWithExt.substring(lastDotIndex) : '';
    let nameWithoutExt = lastDotIndex !== -1 ? baseNameWithExt.substring(0, lastDotIndex) : baseNameWithExt;

    nameWithoutExt = nameWithoutExt
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");

    const cleanName = nameWithoutExt
      .replace(/[^a-zA-Z0-9-_\s]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    return `${cleanName}${ext.toLowerCase()}`;
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ["md", "txt", "docx"];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || "";
    
    if (!allowedExtensions.includes(fileExtension)) {
      alert("Định dạng file không hợp lệ! Hệ thống chỉ hỗ trợ các file: .md, .txt, .docx");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`File quá lớn! Dung lượng file vượt quá giới hạn cho phép (Tối đa ${MAX_FILE_SIZE_MB}MB).`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const root = await navigator.storage.getDirectory();
      const workspaceHandle = await root.getDirectoryHandle(directoryName, { create: true });
      
      let safeFileName = sanitizeFileName(file.name);
      let contentToSave: Blob | File | string = file;

      if (fileExtension === "docx") {
        try {
          safeFileName = safeFileName.replace(/\.docx$/i, '.md');
          contentToSave = await convertDocxFileToMdContent(file);
        } catch (convError) {
          console.error("Lỗi khi chuyển đổi .docx sang Markdown:", convError);
          alert("Không thể chuyển đổi file .docx này sang cấu trúc Markdown. Vui lòng kiểm tra lại file.");
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
      }

      const fileHandle = await workspaceHandle.getFileHandle(safeFileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(contentToSave);
      await writable.close();

      if (fileInputRef.current) fileInputRef.current.value = "";
      
      if (onUploadSuccess) {
        onUploadSuccess({
          originalType: fileExtension,
          savedFileName: safeFileName,
          savedPath: `${directoryName}/${safeFileName}`
        });
      }
    } catch (error) {
      console.error("Lỗi upload/ghi file:", error);
      alert("Đã xảy ra lỗi trong quá trình xử lý và lưu file.");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return {
    fileInputRef,
    triggerFileInput,
    handleFileUpload,
  };
}
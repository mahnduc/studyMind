// core/knowledge/ingestion/document-loader.ts
// MÔ TẢ: Load và extract text từ PDF, Markdown, TXT

import { opfsAdapter } from "@/core/storage/opfs.adapter";
import { KnowledgeDocument, DocumentType } from "../types";


function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function detectType(fileName: string): DocumentType {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "md" || ext === "markdown") return "markdown";
  return "txt";
}

export const documentLoader = {
  /**
   * Load File object từ browser, extract text, lưu binary vào OPFS
   */
  async load(file: File): Promise<KnowledgeDocument> {
    const id = generateId();
    const type = detectType(file.name);
    const arrayBuffer = await file.arrayBuffer();

    // Lưu file gốc vào OPFS để truy cập lại sau
    await opfsAdapter.writeFile(`${id}_${file.name}`, arrayBuffer);

    const content = await this._extractText(file, type, arrayBuffer);

    return {
      id,
      name: file.name,
      type,
      content,
      sizeBytes: file.size,
      uploadedAt: Date.now(),
      chunkCount: 0,
      status: "pending",
    };
  },

  async _extractText(
    file: File,
    type: DocumentType,
    buffer: ArrayBuffer
  ): Promise<string> {
    switch (type) {
      case "txt":
      case "markdown":
        return new TextDecoder().decode(buffer);

      case "pdf":
        return this._extractPdfText(buffer);

      default:
        return new TextDecoder().decode(buffer);
    }
  },

  async _extractPdfText(buffer: ArrayBuffer): Promise<string> {
    try {
      // Dùng pdf.js nếu có (dynamic import)
      const pdfjsLib = await import("pdfjs-dist").catch(() => null);
      if (!pdfjsLib) {
        return "[PDF] pdf.js chưa được cài đặt. Chạy: npm install pdfjs-dist";
      }

      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const pages: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: { str?: string }) => item.str ?? "")
          .join(" ");
        pages.push(pageText);
      }

      return pages.join("\n\n");
    } catch (err) {
      console.error("[DocumentLoader] PDF extract error:", err);
      return `[Lỗi đọc PDF: ${err instanceof Error ? err.message : String(err)}]`;
    }
  },
};
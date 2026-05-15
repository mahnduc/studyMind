// core/knowledge/ingestion/markdown-chunker.ts
// MÔ TẢ: Chia văn bản thành chunks theo heading hoặc sliding window

import { DocumentChunk } from "../types";

export interface ChunkerOptions {
  chunkSize?: number;       // ký tự tối đa mỗi chunk (default: 800)
  chunkOverlap?: number;    // ký tự overlap giữa các chunk (default: 100)
  splitByHeading?: boolean; // ưu tiên split theo heading markdown
}

export const markdownChunker = {
  chunk(
    documentId: string,
    documentName: string,
    content: string,
    options: ChunkerOptions = {}
  ): DocumentChunk[] {
    const {
      chunkSize = 800,
      chunkOverlap = 100,
      splitByHeading = true,
    } = options;

    let segments: string[];

    if (splitByHeading && content.includes("\n#")) {
      segments = this._splitByHeading(content, chunkSize);
    } else {
      segments = this._slidingWindow(content, chunkSize, chunkOverlap);
    }

    let charOffset = 0;
    return segments.map((seg, index) => {
      const startChar = content.indexOf(seg, charOffset);
      const endChar = startChar + seg.length;
      charOffset = Math.max(0, endChar - chunkOverlap);

      return {
        chunkId: `${documentId}_chunk_${index}`,
        documentId,
        documentName,
        content: seg.trim(),
        index,
        startChar: Math.max(0, startChar),
        endChar,
      };
    }).filter((c) => c.content.length > 20); // bỏ chunk quá ngắn
  },

  _splitByHeading(content: string, maxSize: number): string[] {
    const headingRegex = /(?=^#{1,3}\s)/m;
    const sections = content.split(headingRegex).filter((s) => s.trim());
    const result: string[] = [];

    for (const section of sections) {
      if (section.length <= maxSize) {
        result.push(section);
      } else {
        // Section quá dài → dùng sliding window
        result.push(...this._slidingWindow(section, maxSize, 100));
      }
    }

    return result;
  },

  _slidingWindow(content: string, size: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < content.length) {
      const end = Math.min(start + size, content.length);
      let chunk = content.slice(start, end);

      // Cố gắng kết thúc tại ranh giới câu
      if (end < content.length) {
        const lastSentence = Math.max(
          chunk.lastIndexOf(". "),
          chunk.lastIndexOf(".\n"),
          chunk.lastIndexOf("! "),
          chunk.lastIndexOf("? ")
        );
        if (lastSentence > size * 0.5) {
          chunk = chunk.slice(0, lastSentence + 1);
        }
      }

      chunks.push(chunk);
      start += chunk.length - overlap;

      if (chunk.length === 0) break; // safety
    }

    return chunks;
  },
};
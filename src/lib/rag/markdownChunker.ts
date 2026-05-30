import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"; 
import { Document } from "@langchain/core/documents";
import { opfsApi } from "../opfs/opfsApis";

/**
 * Interface cho metadata của mỗi chunk
 */
interface ChunkMetadata {
  source: string;
  chunkId: string;
  position: number;
  totalChunks?: number;
  headings: string[];
  contentType: "text" | "code" | "table" | "list";
  startLine?: number;
  endLine?: number;
}

/**
 * Interface cho chunk output
 */
interface ProcessedChunk {
  content: string;
  metadata: ChunkMetadata;
  tokenCount: number;
}

/**
 * Interface cho heading info
 */
interface HeadingInfo {
  level: number;
  text: string;
  line: number;
}

/**
 * Class chính để xử lý Markdown chunking
 */
class MarkdownChunker {
  private textSplitter: RecursiveCharacterTextSplitter;
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;
  private readonly minChunkSize: number;

  constructor(
    chunkSize: number = 600,
    chunkOverlap: number = 100,
    minChunkSize: number = 100
  ) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.minChunkSize = minChunkSize;

    // Khởi tạo splitter với separators tôn trọng cấu trúc Markdown
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
      separators: [
        "\n## ",      // H2 headers
        "\n### ",     // H3 headers
        "\n#### ",    // H4 headers
        "\n##### ",   // H5 headers
        "\n\n",       // Paragraphs
        "\n",         // Lines
        ". ",         // Sentences
        " ",          // Words
        ""            // Characters
      ],
    });
  }

  /**
   * Parse tất cả headings trong document với line numbers
   */
  private parseAllHeadings(content: string): HeadingInfo[] {
    const lines = content.split(/\r?\n/);
    const headings: HeadingInfo[] = [];

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          line: index,
        });
      }
    });

    return headings;
  }

  /**
   * Tìm line number của chunk trong document
   */
  private findChunkLineNumber(chunkContent: string, fullDocument: string): number {
    const lines = fullDocument.split(/\r?\n/);
    const chunkFirstLine = chunkContent.split(/\r?\n/)[0].trim();

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === chunkFirstLine) {
        return i;
      }
    }
    return 0;
  }

  /**
   * Trích xuất heading hierarchy CHÍNH XÁC cho chunk
   */
  private extractHeadings(
    chunkContent: string,
    fullDocument: string,
    allHeadings: HeadingInfo[]
  ): string[] {
    const chunkLine = this.findChunkLineNumber(chunkContent, fullDocument);

    const relevantHeadings = allHeadings.filter((h) => h.line <= chunkLine);

    if (relevantHeadings.length === 0) return [];

    // Xây dựng hierarchy từ dưới lên
    const hierarchy: string[] = [];
    const lastHeading = relevantHeadings[relevantHeadings.length - 1];

    // Tìm parent headings theo level
    let currentLevel = lastHeading.level;
    for (let i = relevantHeadings.length - 1; i >= 0; i--) {
      const heading = relevantHeadings[i];
      if (heading.level < currentLevel) {
        hierarchy.unshift(heading.text);
        currentLevel = heading.level;
      } else if (heading.level === currentLevel && i === relevantHeadings.length - 1) {
        hierarchy.push(heading.text);
      }
    }

    return hierarchy;
  }

  /**
   * Xác định loại nội dung của chunk
   */
  private detectContentType(content: string): "text" | "code" | "table" | "list" {
    const trimmed = content.trim();

    // Check code block (ưu tiên cao nhất)
    if (trimmed.includes("```") || /^\s{4,}/m.test(content)) {
      return "code";
    }

    if (
      trimmed.includes("|") &&
      /\|[\s-]+\|/.test(trimmed) &&
      trimmed.split("\n").filter((line) => line.includes("|")).length >= 2
    ) {
      return "table";
    }

    // Check list (ordered hoặc unordered)
    const listPattern = /^[\s]*[-*+]\s+.+$/m;
    const orderedListPattern = /^[\s]*\d+\.\s+.+$/m;
    if (listPattern.test(trimmed) || orderedListPattern.test(trimmed)) {
      return "list";
    }

    return "text";
  }

  /**
   * Ước lượng số token (xấp xỉ)
   */
  private estimateTokens(text: string): number {
    const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
    const divisor = hasVietnamese ? 3 : 3.8;
    return Math.ceil(text.length / divisor);
  }

  /**
   * Gộp chunk nhỏ với chunk kế tiếp
   */
  private mergeSmallChunks(chunks: ProcessedChunk[]): ProcessedChunk[] {
    const merged: ProcessedChunk[] = [];
    let i = 0;

    while (i < chunks.length) {
      const currentChunk = chunks[i];

      if (
        currentChunk.tokenCount < this.minChunkSize &&
        i < chunks.length - 1
      ) {
        const nextChunk = chunks[i + 1];
        const mergedContent = currentChunk.content + "\n\n" + nextChunk.content;
        const mergedTokens = this.estimateTokens(mergedContent);

        merged.push({
          content: mergedContent,
          metadata: {
            ...currentChunk.metadata,
            chunkId: `${currentChunk.metadata.source}_chunk_${merged.length + 1}`,
            position: merged.length,
            contentType: this.detectContentType(mergedContent),
            endLine: nextChunk.metadata.endLine,
          },
          tokenCount: mergedTokens,
        });

        i += 2;
      } else {
        merged.push({
          ...currentChunk,
          metadata: {
            ...currentChunk.metadata,
            chunkId: `${currentChunk.metadata.source}_chunk_${merged.length + 1}`,
            position: merged.length,
          },
        });
        i++;
      }
    }

    return merged;
  }

  /**
   * Xử lý Markdown thành chunks
   */
  async processMarkdown(filePath: string): Promise<ProcessedChunk[]> {
    const content = await opfsApi.readAsText(filePath);
    const fileName = filePath.split('/').pop() || 'unknown-file';

    const allHeadings = this.parseAllHeadings(content);

    const doc = new Document({
      pageContent: content,
      metadata: { source: fileName },
    });

    const chunks = await this.textSplitter.splitDocuments([doc]);

    const processedChunks: ProcessedChunk[] = chunks.map((chunk, index) => {
      const headings = this.extractHeadings(
        chunk.pageContent,
        content,
        allHeadings
      );
      const contentType = this.detectContentType(chunk.pageContent);
      const tokenCount = this.estimateTokens(chunk.pageContent);
      const startLine = this.findChunkLineNumber(chunk.pageContent, content);
      const endLine = startLine + chunk.pageContent.split(/\r?\n/).length - 1;

      return {
        content: chunk.pageContent,
        metadata: {
          source: fileName,
          chunkId: `${fileName}_chunk_${index + 1}`,
          position: index,
          totalChunks: chunks.length,
          headings: headings,
          contentType: contentType,
          startLine: startLine,
          endLine: endLine,
        },
        tokenCount: tokenCount,
      };
    });

    const mergedChunks = this.mergeSmallChunks(processedChunks);

    mergedChunks.forEach((chunk) => {
      chunk.metadata.totalChunks = mergedChunks.length;
    });

    return mergedChunks;
  }

  /**
   * Xuất chunks ra file JSON
   */
  async exportToJSON(chunks: ProcessedChunk[]): Promise<string> {
    const output = {
      totalChunks: chunks.length,
      averageTokens: chunks.length > 0 
        ? Math.round(chunks.reduce((sum, c) => sum + c.tokenCount, 0) / chunks.length)
        : 0,
      minTokens: chunks.length > 0 ? Math.min(...chunks.map((c) => c.tokenCount)) : 0,
      maxTokens: chunks.length > 0 ? Math.max(...chunks.map((c) => c.tokenCount)) : 0,
      chunks: chunks,
      generatedAt: new Date().toISOString(),
      config: {
        chunkSize: this.chunkSize,
        chunkOverlap: this.chunkOverlap,
        minChunkSize: this.minChunkSize,
      },
    };
    return JSON.stringify(output, null, 2);
  }

  /**
   * In thống kê chunks
   */
  printStatistics(chunks: ProcessedChunk[]): void {
    console.log("\nTHỐNG KÊ CHUNKS:");
    console.log("═".repeat(60));
    console.log(`Tổng số chunks: ${chunks.length}`);
    console.log(
      `Tokens trung bình: ${Math.round(chunks.reduce((sum, c) => sum + c.tokenCount, 0) / chunks.length)}`
    );
    console.log(`Token nhỏ nhất: ${Math.min(...chunks.map((c) => c.tokenCount))}`);
    console.log(`Token lớn nhất: ${Math.max(...chunks.map((c) => c.tokenCount))}`);

    const typeCount = chunks.reduce(
      (acc, c) => {
        acc[c.metadata.contentType] = (acc[c.metadata.contentType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("\nPhân bố theo loại:");
    Object.entries(typeCount).forEach(([type, count]) => {
      const percentage = ((count / chunks.length) * 100).toFixed(1);
      console.log(`  ${type.padEnd(10)}: ${count} chunks (${percentage}%)`);
    });

    const smallChunks = chunks.filter((c) => c.tokenCount < this.minChunkSize);
    if (smallChunks.length > 0) {
      console.log(`\n  Có ${smallChunks.length} chunks nhỏ hơn ${this.minChunkSize} tokens`);
    }

    console.log("═".repeat(60) + "\n");
  }

  /**
   * In preview chi tiết của chunks
   */
  printDetailedPreview(chunks: ProcessedChunk[], count: number = 3): void {
    console.log(`PREVIEW ${Math.min(count, chunks.length)} CHUNKS:\n`);

    chunks.slice(0, count).forEach((chunk, idx) => {
      console.log(`${"─".repeat(60)}`);
      console.log(`Chunk ${idx + 1}/${chunks.length}`);
      console.log(`${"─".repeat(60)}`);
      console.log(`ID: ${chunk.metadata.chunkId}`);
      console.log(`Headings: ${chunk.metadata.headings.join(" > ") || "(none)"}`);
      console.log(`Type: ${chunk.metadata.contentType}`);
      console.log(`Tokens: ${chunk.tokenCount}`);
      console.log(
        `Lines: ${chunk.metadata.startLine} - ${chunk.metadata.endLine}`
      );
      console.log(`\nContent preview:`);
      console.log(
        chunk.content.substring(0, 200).replace(/\r?\n/g, "\n") +
          (chunk.content.length > 200 ? "..." : "")
      );
      console.log();
    });
  }
}

export { MarkdownChunker };
export type { ProcessedChunk, ChunkMetadata };
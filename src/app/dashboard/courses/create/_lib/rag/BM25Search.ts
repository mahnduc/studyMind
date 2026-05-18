import { ProcessedChunk } from "./markdownChunker";

/**
 * Interface cho kết quả tìm kiếm
 */
interface SearchResult {
  chunk: ProcessedChunk;
  score: number;
  highlights: string[];
}

/**
 * Interface cho document đã được index
 */
interface IndexedDocument {
  id: string;
  chunk: ProcessedChunk;
  tokens: string[];
  tokenFrequency: Map<string, number>;
}

/**
 * BM25 Search Engine cho chunks
 */
class BM25Search {
  private documents: IndexedDocument[] = [];
  private idf: Map<string, number> = new Map();
  private avgDocLength: number = 0;
  private readonly k1: number;
  private readonly b: number;
  private stopWords: Set<string>;

  constructor(k1: number = 1.5, b: number = 0.75) {
    this.k1 = k1;
    this.b = b;
    this.stopWords = this.getStopWords();
  }

  /**
   * Stop words cho tiếng Việt và tiếng Anh
   */
  private getStopWords(): Set<string> {
    return new Set([
      // Tiếng Việt
      "và", "của", "có", "được", "trong", "là", "để", "một", "các", "với",
      "không", "này", "như", "từ", "cho", "hay", "hoặc", "đã", "sẽ", "bởi",
      "về", "khi", "những", "người", "vì", "tại", "theo", "nếu", "đó", "mà",
      // Tiếng Anh
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
      "been", "being", "have", "has", "had", "do", "does", "did", "will",
      "would", "should", "could", "may", "might", "must", "can", "this",
      "that", "these", "those", "i", "you", "he", "she", "it", "we", "they",
    ]);
  }

  /**
   * Tokenize text thành các từ
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1 && !this.stopWords.has(token));
  }

  /**
   * Tính term frequency cho document
   */
  private calculateTermFrequency(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    tokens.forEach((token) => {
      tf.set(token, (tf.get(token) || 0) + 1);
    });
    return tf;
  }

  /**
   * Tính IDF (Inverse Document Frequency)
   */
  private calculateIDF(): void {
    const N = this.documents.length;
    const documentFrequency = new Map<string, number>();

    // Đếm số document chứa mỗi term
    this.documents.forEach((doc) => {
      const uniqueTokens = new Set(doc.tokens);
      uniqueTokens.forEach((token) => {
        documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
      });
    });

    // Tính IDF = log((N - df + 0.5) / (df + 0.5) + 1)
    documentFrequency.forEach((df, term) => {
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
      this.idf.set(term, idf);
    });
  }

  /**
   * Tính average document length
   */
  private calculateAvgDocLength(): void {
    const totalLength = this.documents.reduce(
      (sum, doc) => sum + doc.tokens.length,
      0
    );
    this.avgDocLength = totalLength / this.documents.length;
  }

  /**
   * Index chunks để chuẩn bị cho tìm kiếm
   */
  indexChunks(chunks: ProcessedChunk[]): void {
    console.log(`Bắt đầu index ${chunks.length} chunks...`);

    this.documents = chunks.map((chunk) => {
      const tokens = this.tokenize(chunk.content);
      const tokenFrequency = this.calculateTermFrequency(tokens);

      return {
        id: chunk.metadata.chunkId,
        chunk: chunk,
        tokens: tokens,
        tokenFrequency: tokenFrequency,
      };
    });

    this.calculateIDF();
    this.calculateAvgDocLength();

    console.log(`Đã index thành công!`);
    console.log(`- Tổng documents: ${this.documents.length}`);
    console.log(`- Tổng unique terms: ${this.idf.size}`);
    console.log(`- Average doc length: ${this.avgDocLength.toFixed(2)} tokens`);
  }

  /**
   * Tính BM25 score cho một document với query
   */
  private calculateBM25Score(
    doc: IndexedDocument,
    queryTokens: string[]
  ): number {
    let score = 0;
    const docLength = doc.tokens.length;

    queryTokens.forEach((term) => {
      const termFreq = doc.tokenFrequency.get(term) || 0;
      const idf = this.idf.get(term) || 0;

      // BM25 formula
      const numerator = termFreq * (this.k1 + 1);
      const denominator =
        termFreq +
        this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));

      score += idf * (numerator / denominator);
    });

    return score;
  }

  /**
   * Tạo highlights cho kết quả
   */
  private generateHighlights(
    content: string,
    queryTokens: string[],
    maxHighlights: number = 3
  ): string[] {
    const highlights: string[] = [];
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    for (const sentence of sentences) {
      const sentenceTokens = this.tokenize(sentence);
      const matchCount = sentenceTokens.filter((token) =>
        queryTokens.includes(token)
      ).length;

      if (matchCount > 0) {
        let highlighted = sentence.trim();
        queryTokens.forEach((term) => {
          const regex = new RegExp(`\\b${term}\\b`, "gi");
          highlighted = highlighted.replace(regex, `**$&**`);
        });
        highlights.push(highlighted);

        if (highlights.length >= maxHighlights) break;
      }
    }

    return highlights;
  }

  /**
   * Tìm kiếm với BM25
   */
  search(query: string, topK: number = 5): SearchResult[] {
    if (this.documents.length === 0) {
      console.warn("Chưa có documents được index!");
      return [];
    }

    const queryTokens = this.tokenize(query);

    if (queryTokens.length === 0) {
      console.warn("Query không hợp lệ sau khi tokenize!");
      return [];
    }

    console.log(`Tìm kiếm: "${query}"`);
    console.log(`Query tokens: [${queryTokens.join(", ")}]`);

    // Tính score cho tất cả documents
    const scores = this.documents.map((doc) => ({
      doc: doc,
      score: this.calculateBM25Score(doc, queryTokens),
    }));

    // Sắp xếp theo score giảm dần
    scores.sort((a, b) => b.score - a.score);

    // Lấy top K kết quả
    const topResults = scores.slice(0, topK).filter((item) => item.score > 0);

    // Tạo search results với highlights
    const results: SearchResult[] = topResults.map((item) => ({
      chunk: item.doc.chunk,
      score: item.score,
      highlights: this.generateHighlights(item.doc.chunk.content, queryTokens),
    }));

    console.log(`Tìm thấy ${results.length} kết quả`);

    return results;
  }

  /**
   * Tìm kiếm với filter theo metadata
   */
  searchWithFilter(
    query: string,
    filters: {
      contentType?: ("text" | "code" | "table" | "list")[];
      headings?: string[];
      minTokens?: number;
      maxTokens?: number;
    },
    topK: number = 5
  ): SearchResult[] {
    if (this.documents.length === 0) {
      return [];
    }

    // Filter documents trước
    let filteredDocs = this.documents;

    if (filters.contentType && filters.contentType.length > 0) {
      filteredDocs = filteredDocs.filter((doc) =>
        filters.contentType!.includes(doc.chunk.metadata.contentType)
      );
    }

    if (filters.headings && filters.headings.length > 0) {
      filteredDocs = filteredDocs.filter((doc) =>
        filters.headings!.some((heading) =>
          doc.chunk.metadata.headings.some((h) =>
            h.toLowerCase().includes(heading.toLowerCase())
          )
        )
      );
    }

    if (filters.minTokens !== undefined) {
      filteredDocs = filteredDocs.filter(
        (doc) => doc.chunk.tokenCount >= filters.minTokens!
      );
    }

    if (filters.maxTokens !== undefined) {
      filteredDocs = filteredDocs.filter(
        (doc) => doc.chunk.tokenCount <= filters.maxTokens!
      );
    }

    console.log(`Filtered ${this.documents.length} → ${filteredDocs.length} documents`);

    // Tạm thời lưu documents gốc
    const originalDocs = this.documents;
    this.documents = filteredDocs;

    // Thực hiện search trên filtered documents
    const results = this.search(query, topK);

    // Khôi phục documents gốc
    this.documents = originalDocs;

    return results;
  }

  /**
   * Lấy thống kê về index
   */
  getStats() {
    return {
      totalDocuments: this.documents.length,
      totalUniqueTerms: this.idf.size,
      avgDocLength: this.avgDocLength,
      k1: this.k1,
      b: this.b,
    };
  }

  /**
   * Export index ra JSON (để lưu và tái sử dụng)
   */
  exportIndex() {
    return {
      documents: this.documents.map((doc) => ({
        id: doc.id,
        chunk: doc.chunk,
        tokens: doc.tokens,
        tokenFrequency: Array.from(doc.tokenFrequency.entries()),
      })),
      idf: Array.from(this.idf.entries()),
      avgDocLength: this.avgDocLength,
      stats: this.getStats(),
    };
  }

  /**
   * Import index từ JSON
   */
  importIndex(indexData: any): void {
    this.documents = indexData.documents.map((doc: any) => ({
      id: doc.id,
      chunk: doc.chunk,
      tokens: doc.tokens,
      tokenFrequency: new Map(doc.tokenFrequency),
    }));

    this.idf = new Map(indexData.idf);
    this.avgDocLength = indexData.avgDocLength;

    console.log(`Đã import index với ${this.documents.length} documents`);
  }
}

/**
 * Utility class để format và hiển thị kết quả
 */
class SearchResultFormatter {
  /**
   * Format kết quả search thành text
   */
  static formatResults(results: SearchResult[]): string {
    if (results.length === 0) {
      return "Không tìm thấy kết quả phù hợp.";
    }

    let output = `\nTÌM THẤY ${results.length} KẾT QUẢ:\n`;
    output += "═".repeat(80) + "\n\n";

    results.forEach((result, index) => {
      output += `Kết quả ${index + 1} (Score: ${result.score.toFixed(4)})\n`;
      output += "─".repeat(80) + "\n";
      output += `Chunk ID: ${result.chunk.metadata.chunkId}\n`;
      output += `Headings: ${result.chunk.metadata.headings.join(" > ") || "(none)"}\n`;
      output += `Type: ${result.chunk.metadata.contentType} | Tokens: ${result.chunk.tokenCount}\n`;

      if (result.highlights.length > 0) {
        output += `\nHighlights:\n`;
        result.highlights.forEach((highlight, i) => {
          output += `  ${i + 1}. ${highlight}\n`;
        });
      }

      output += "\n";
    });

    return output;
  }

  /**
   * Format kết quả thành JSON cho API
   */
  static formatResultsJSON(results: SearchResult[]) {
    return {
      total: results.length,
      results: results.map((result, index) => ({
        rank: index + 1,
        score: result.score,
        chunkId: result.chunk.metadata.chunkId,
        source: result.chunk.metadata.source,
        headings: result.chunk.metadata.headings,
        contentType: result.chunk.metadata.contentType,
        tokenCount: result.chunk.tokenCount,
        content: result.chunk.content,
        highlights: result.highlights,
      })),
    };
  }

  /**
   * Format kết quả cho HTML display
   */
  static formatResultsHTML(results: SearchResult[]): string {
    if (results.length === 0) {
      return '<div class="no-results">Không tìm thấy kết quả phù hợp.</div>';
    }

    let html = '<div class="search-results">';

    results.forEach((result, index) => {
      html += `
        <div class="result-item" data-score="${result.score}">
          <div class="result-header">
            <span class="rank">#${index + 1}</span>
            <span class="score">Score: ${result.score.toFixed(4)}</span>
            <span class="type">${result.chunk.metadata.contentType}</span>
          </div>
          <div class="result-meta">
            <div class="chunk-id">${result.chunk.metadata.chunkId}</div>
            <div class="headings">${result.chunk.metadata.headings.join(" > ") || "(none)"}</div>
          </div>
          <div class="highlights">
            ${result.highlights.map((h) => `<p>${h}</p>`).join("")}
          </div>
        </div>
      `;
    });

    html += "</div>";
    return html;
  }
}

export { BM25Search, SearchResultFormatter };
export type { SearchResult, IndexedDocument };
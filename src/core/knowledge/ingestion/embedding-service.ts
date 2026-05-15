// core/knowledge/ingestion/embedding-service.ts
// MÔ TẢ: Tạo embedding vectors cho text chunks
//        Dùng Groq API (hoặc local model nếu có)
//        Fallback: TF-IDF bag-of-words nếu không có embedding API

import { ChunkEmbedding, DocumentChunk } from "../types";

const EMBEDDING_MODEL = "nomic-embed-text-v1";
const GROQ_EMBEDDING_URL = "https://api.groq.com/openai/v1/embeddings";

// Lấy API key từ localStorage (người dùng đã nhập qua settings)
function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("groq_api_key") ?? "";
}

export const embeddingService = {
  /**
   * Tạo embeddings cho nhiều chunks cùng lúc (batch)
   */
  async embedChunks(chunks: DocumentChunk[]): Promise<ChunkEmbedding[]> {
    const apiKey = getApiKey();

    if (apiKey) {
      try {
        return await this._embedWithGroq(chunks, apiKey);
      } catch (err) {
        console.warn("[EmbeddingService] Groq embedding thất bại, dùng fallback TF-IDF:", err);
      }
    }

    return this._embedWithTFIDF(chunks);
  },

  async _embedWithGroq(
    chunks: DocumentChunk[],
    apiKey: string
  ): Promise<ChunkEmbedding[]> {
    const BATCH_SIZE = 20;
    const results: ChunkEmbedding[] = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const res = await fetch(GROQ_EMBEDDING_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: batch.map((c) => c.content),
        }),
      });

      if (!res.ok) throw new Error(`Embedding API ${res.status}`);
      const data = await res.json() as {
        data: Array<{ embedding: number[]; index: number }>;
      };

      for (const item of data.data) {
        const chunk = batch[item.index];
        results.push({
          chunkId: chunk.chunkId,
          documentId: chunk.documentId,
          vector: item.embedding,
          model: EMBEDDING_MODEL,
        });
      }
    }

    return results;
  },

//   /**
//    * Fallback: TF-IDF bag-of-words (không cần API)
//    * Vector dimension = top 512 words trong corpus
//    */
//   _embedWithTFIDF(chunks: DocumentChunk[]): ChunkEmbedding[] {
//     const DIM = 512;

//     // Build vocabulary từ tất cả chunks
//     const termFreq = new Map<string, number>();
//     for (const chunk of chunks) {
//       const words = this._tokenize(chunk.content);
//       for (const w of new Set(words)) {
//         termFreq.set(w, (termFreq.get(w) ?? 0) + 1);
//       }
//     }

//     // Lấy top DIM terms theo document frequency
//     const vocab = Array.from(termFreq.entries())
//       .sort((a, b) => b[1] - a[1])
//       .slice(0, DIM)
//       .map(([term]) => term);
//     const vocabIndex = new Map(vocab.map((t, i) => [t, i]));

//     return chunks.map((chunk) => {
//       const words = this._tokenize(chunk.content);
//       const vector = new Array<number>(DIM).fill(0);
//       const total = words.length || 1;

//       for (const w of words) {
//         const idx = vocabIndex.get(w);
//         if (idx !== undefined) {
//           const tf = 1 / total;
//           const idf = Math.log(chunks.length / (termFreq.get(w) ?? 1));
//           vector[idx] += tf * idf;
//         }
//       }

//       // L2 normalize
//       const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
//       const normalized = vector.map((v) => v / norm);

//       return {
//         chunkId: chunk.chunkId,
//         documentId: chunk.documentId,
//         vector: normalized,
//         model: "tfidf-fallback",
//       };
//     });
//   },

  _tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\sàáảãạăắặẵẳặâấầậẩẫđèéẹẻẽêềếệểễìíịỉĩòóọỏõôốồộổỗơớờợởỡùúụủũưứừựửữỳýỵỷỹ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1);
  },
};
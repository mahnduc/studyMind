// core/knowledge/retrieval/vector-search.ts
// MÔ TẢ: Cosine similarity search trên embedding vectors

import { knowledgeStorageRepository } from "@/core/storage/repositories/knowledge.repository";
import { embeddingService } from "../ingestion/embedding-service";
import { RetrievalResult, RetrievalOptions } from "../types";

export const vectorSearch = {
  async search(options: RetrievalOptions): Promise<RetrievalResult[]> {
    const { query, topK = 5, knowledgeBaseId } = options;

    // Embed query
    const queryChunk = {
      chunkId: "query",
      documentId: "query",
      documentName: "query",
      content: query,
      index: 0,
      startChar: 0,
      endChar: query.length,
    };

    const [queryEmbedding] = await embeddingService.embedChunks([queryChunk]);
    if (!queryEmbedding) return [];

    // Lấy tất cả embeddings từ DB
    let allEmbeddings = await knowledgeStorageRepository.getAllEmbeddings();
    if (knowledgeBaseId) {
      allEmbeddings = allEmbeddings.filter((e) => e.documentId === knowledgeBaseId);
    }

    if (allEmbeddings.length === 0) return [];

    // Lấy chunks tương ứng
    const allChunks = await knowledgeStorageRepository.getAllChunks();
    const chunkMap = new Map(allChunks.map((c) => [c.chunkId, c]));

    // Cosine similarity
    const scored = allEmbeddings.map((emb) => {
      const score = cosineSimilarity(queryEmbedding.vector, emb.vector);
      const chunk = chunkMap.get(emb.chunkId);
      return { emb, chunk, score };
    });

    return scored
      .filter((s) => s.chunk !== undefined && s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => ({
        chunkId: s.emb.chunkId,
        documentId: s.emb.documentId,
        documentName: s.chunk!.documentName,
        content: s.chunk!.content,
        score: s.score,
        retrievalMethod: "vector" as const,
      }));
  },
};

function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
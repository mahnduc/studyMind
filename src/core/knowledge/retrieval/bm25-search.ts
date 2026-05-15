// core/knowledge/retrieval/bm25-search.ts
// MÔ TẢ: BM25 full-text search thuần TypeScript (không cần index ngoài)

import { knowledgeStorageRepository } from "@/core/storage/repositories/knowledge.repository";
import { RetrievalResult, RetrievalOptions, DocumentChunk } from "../types";

const K1 = 1.5;
const B = 0.75;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sàáảãạăắặẵẳặâấầậẩẫđèéẹẻẽêềếệểễìíịỉĩòóọỏõôốồộổỗơớờợởỡùúụủũưứừựửữỳýỵỷỹ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

export const bm25Search = {
  async search(options: RetrievalOptions): Promise<RetrievalResult[]> {
    const { query, topK = 5, knowledgeBaseId } = options;

    let chunks = await knowledgeStorageRepository.getAllChunks();
    if (knowledgeBaseId) {
      chunks = chunks.filter((c) => c.documentId === knowledgeBaseId);
    }
    if (chunks.length === 0) return [];

    const queryTerms = tokenize(query);
    if (queryTerms.length === 0) return [];

    // Precompute term frequencies per chunk
    const chunkTokens = chunks.map((c) => tokenize(c.content));
    const avgLen = chunkTokens.reduce((s, t) => s + t.length, 0) / chunks.length;

    // IDF per query term
    const idf = new Map<string, number>();
    for (const term of queryTerms) {
      const df = chunkTokens.filter((tokens) => tokens.includes(term)).length;
      idf.set(term, Math.log((chunks.length - df + 0.5) / (df + 0.5) + 1));
    }

    const scores = chunks.map((chunk, i) => {
      const tokens = chunkTokens[i];
      const docLen = tokens.length;
      let score = 0;

      for (const term of queryTerms) {
        const tf = tokens.filter((t) => t === term).length;
        const termIdf = idf.get(term) ?? 0;
        const numerator = tf * (K1 + 1);
        const denominator = tf + K1 * (1 - B + B * (docLen / avgLen));
        score += termIdf * (numerator / denominator);
      }

      return { chunk, score };
    });

    const maxScore = Math.max(...scores.map((s) => s.score), 1);

    return scores
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => ({
        chunkId: s.chunk.chunkId,
        documentId: s.chunk.documentId,
        documentName: s.chunk.documentName,
        content: s.chunk.content,
        score: s.score / maxScore, // normalize 0-1
        retrievalMethod: "bm25" as const,
      }));
  },
};
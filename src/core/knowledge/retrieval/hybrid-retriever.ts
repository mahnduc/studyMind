// core/knowledge/retrieval/hybrid-retriever.ts
// MÔ TẢ: Kết hợp vector search + BM25, dedup, merge scores

import { vectorSearch } from "./vector-search";
import { bm25Search } from "./bm25-search";
import { reranker } from "./reranker";
import { RetrievalResult, RetrievalOptions } from "../types";

export const hybridRetriever = {
  async retrieve(options: RetrievalOptions): Promise<RetrievalResult[]> {
    const topK = options.topK ?? 5;
    const fetchK = topK * 3; // lấy nhiều hơn để merge

    // Chạy song song
    const [vectorResults, bm25Results] = await Promise.all([
      vectorSearch.search({ ...options, topK: fetchK }).catch(() => []),
      bm25Search.search({ ...options, topK: fetchK }).catch(() => []),
    ]);

    // Merge với Reciprocal Rank Fusion
    const merged = this._rrf(vectorResults, bm25Results, topK * 2);

    // Rerank nếu cần (cross-encoder hoặc score-based)
    const reranked = reranker.rerank(merged, options.query, topK);

    return reranked;
  },

  /**
   * Reciprocal Rank Fusion: score = Σ 1/(k + rank)
   */
  _rrf(
    list1: RetrievalResult[],
    list2: RetrievalResult[],
    topK: number,
    k = 60
  ): RetrievalResult[] {
    const scores = new Map<string, { result: RetrievalResult; score: number }>();

    const addRanks = (list: RetrievalResult[]) => {
      list.forEach((result, i) => {
        const existing = scores.get(result.chunkId);
        const rrfScore = 1 / (k + i + 1);
        if (existing) {
          existing.score += rrfScore;
        } else {
          scores.set(result.chunkId, {
            result: { ...result, retrievalMethod: "hybrid" },
            score: rrfScore,
          });
        }
      });
    };

    addRanks(list1);
    addRanks(list2);

    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => ({ ...s.result, score: s.score }));
  },
};
// core/knowledge/retrieval/reranker.ts
// MÔ TẢ: Rerank kết quả retrieval dựa trên keyword overlap + score
//        (Lightweight reranker không cần model ngoài)

import { RetrievalResult } from "../types";

export const reranker = {
  rerank(
    results: RetrievalResult[],
    query: string,
    topK: number
  ): RetrievalResult[] {
    if (results.length === 0) return [];

    const queryTokens = new Set(
      query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

    const scored = results.map((result) => {
      const contentLower = result.content.toLowerCase();

      // Keyword overlap bonus
      let overlapCount = 0;
      for (const token of queryTokens) {
        if (contentLower.includes(token)) overlapCount++;
      }
      const overlapBonus =
        queryTokens.size > 0 ? overlapCount / queryTokens.size : 0;

      // Length penalty (quá ngắn hoặc quá dài đều bị giảm điểm)
      const idealLen = 400;
      const lenPenalty =
        1 - Math.abs(result.content.length - idealLen) / (idealLen * 2);

      const finalScore = result.score * 0.7 + overlapBonus * 0.2 + lenPenalty * 0.1;

      return { ...result, score: Math.max(0, finalScore) };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  },
};
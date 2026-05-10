"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getVectorIndexFromStorage,
  initializeSearchFromStorage,
} from "@/app/dashboard/chatbot/_lib/rag/api";
import { BM25Search } from "@/app/dashboard/chatbot/_lib/rag/BM25Search";

import { 
  cosineSimilarity, 
  fuseResults, 
  generateQueryEmbedding, 
  readJsonFromOPFS, 
  StoredChunk, 
  VectorIndexItem 
} from "./search-logic";
import { keyService } from "@/app/dashboard/settings/api-key/_services/key.service";

interface RagResponseToolProps {
  query: string;           // Câu hỏi từ thanh chat chính
  selectedKb: string;      // Knowledge Base đang chọn
  onComplete?: (answer: string) => void; // Callback khi trả lời xong
}

export default function RagResponseTool({ query, selectedKb, onComplete }: RagResponseToolProps) {
  const [searchEngine, setSearchEngine] = useState<BM25Search | null>(null);
  const [vectorIndex, setVectorIndex] = useState<VectorIndexItem[]>([]);
  const [chunks, setChunks] = useState<StoredChunk[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSources, setShowSources] = useState(false);

  // 1. Map dữ liệu chunks (Logic giữ nguyên)
  const chunkMap = useMemo(() => {
    const map = new Map<string, StoredChunk>();
    if (Array.isArray(chunks)) {
      chunks.forEach((c) => { if (c?.metadata?.chunkId) map.set(c.metadata.chunkId, c); });
    }
    return map;
  }, [chunks]);

  // 2. Khởi tạo tài nguyên RAG
  useEffect(() => {
    if (!selectedKb) return;
    const init = async () => {
      try {
        const [engine, vectors, storedChunks] = await Promise.all([
          initializeSearchFromStorage(selectedKb),
          getVectorIndexFromStorage(selectedKb),
          readJsonFromOPFS<StoredChunk[]>(selectedKb, "chunks.json")
        ]);
        setSearchEngine(engine);
        setVectorIndex(vectors || []);
        setChunks(Array.isArray(storedChunks) ? storedChunks : []);
      } catch (err) {
        console.error("RAG Tool Init Error:", err);
      }
    };
    init();
  }, [selectedKb]);

  // 3. Tự động chạy Search khi Component được mount với query
  useEffect(() => {
    const executeSearch = async () => {
      if (!searchEngine || vectorIndex.length === 0 || !query) return;
      
      setLoading(true);
      try {
        const [bm25Hits, queryVec] = await Promise.all([
          searchEngine.search(query, 5), // Giảm xuống 5 để nhanh hơn
          generateQueryEmbedding(query)
        ]);

        const vectorHits = vectorIndex
          .map(item => ({
            chunk: chunkMap.get(item.chunkId)!,
            score: cosineSimilarity(queryVec, item.embedding),
          }))
          .filter(h => h.chunk)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        const hybridResults = fuseResults(bm25Hits, vectorHits);
        setResults(hybridResults);

        if (hybridResults.length > 0) {
          const activeKey = await keyService.getRandomKey("groq");
          const context = hybridResults.map(r => `[Nguồn: ${r.chunk.metadata.headings.join(" > ")}]: ${r.chunk.content}`).join("\n\n");

          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${activeKey}` },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: "Bạn là trợ lý tra cứu tài liệu. Trả lời bằng tiếng Việt, ngắn gọn, có dẫn chứng." },
                { role: "user", content: `Context:\n${context}\n\nCâu hỏi: ${query}` }
              ],
              temperature: 0.1,
            }),
          });
          const data = await res.json();
          const finalAnswer = data.choices[0].message.content;
          setAnswer(finalAnswer);
          onComplete?.(finalAnswer);
        } else {
          setAnswer("Không tìm thấy thông tin trong tài liệu.");
        }
      } catch (error) {
        setAnswer("Đã xảy ra lỗi khi truy vấn tài liệu.");
      } finally {
        setLoading(false);
      }
    };

    executeSearch();
  }, [searchEngine, vectorIndex, query]);

  // --- Render UI (Gọn nhẹ cho Message Bubble) ---
  return (
    <div className="w-full max-w-2xl my-2 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Header trạng thái */}
        <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              Knowledge Search: {selectedKb}
            </span>
          </div>
        </div>

        {/* Nội dung câu trả lời */}
        <div className="p-4">
          {loading ? (
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
            </div>
          ) : (
            <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
              {answer}
            </div>
          )}
        </div>

        {/* Nguồn tham khảo (Collapsible) */}
        {!loading && results.length > 0 && (
          <div className="border-t border-gray-50">
            <button 
              onClick={() => setShowSources(!showSources)}
              className="w-full px-4 py-2 text-left text-[9px] font-bold text-gray-400 hover:text-[#FF3399] transition-colors flex justify-between"
            >
              DẪN CHỨNG ({results.length})
              <span>{showSources ? "收起" : "展开"}</span>
            </button>
            {showSources && (
              <div className="px-4 pb-4 space-y-2 max-h-40 overflow-y-auto bg-gray-50/30">
                {results.map((res, i) => (
                  <div key={i} className="text-[11px] text-gray-500 border-l-2 border-gray-200 pl-2 py-1">
                    {res.chunk.content.substring(0, 150)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
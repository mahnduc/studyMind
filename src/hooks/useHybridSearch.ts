import { useState, useEffect } from "react";
import { getAllKnowledgeBases, initializeSearchFromStorage, getVectorIndexFromStorage } from "../lib/rag/api";
import { 
  generateQueryEmbedding, 
  cosineSimilarity, 
  fuseResults, 
  readJsonFromOPFS,
  StoredChunk 
} from "../lib/rag/search-logic";
import { keyApi } from "../app/dashboard/settings/api-key/_api/key.api";

export interface HybridResultItem {
  chunk: StoredChunk;
  score: number;
  type: string;
}

export function useHybridSearch() {
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>([]);
  const [selectedKB, setSelectedKB] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  // Quản lý API Key và cấu hình Mô hình Groq
  const [apiKey, setApiKey] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);

  const [results, setResults] = useState<HybridResultItem[]>([]);
  const [llmResponse, setLlmResponse] = useState<string>("");

  // Tự động tải danh sách bộ tri thức và kiểm tra API Key
  useEffect(() => {
    async function initPage() {
      try {
        const kbs = await getAllKnowledgeBases();
        setKnowledgeBases(kbs);
        const savedKey = await keyApi.getRandomKey("groq");
        if (savedKey) setApiKey(savedKey);
      } catch (err) {
        console.error("Lỗi khởi tạo dữ liệu:", err);
      }
    }
    initPage();
  }, []);

  // Hàm gọi API Groq
  const generateFinalAnswer = async (question: string, contextChunks: HybridResultItem[]): Promise<string> => {
    const currentKey = await keyApi.getRandomKey("groq");
    if (!currentKey) {
      throw new Error("Thiếu Groq API Key. Vui lòng cấu hình API Key để nhận câu trả lời tổng hợp.");
    }

    const contextText = contextChunks
      .slice(0, 5) 
      .map((item, idx) => `[Tài liệu tham khảo ${idx + 1}]:\n${item.chunk.content}`)
      .join("\n\n");

    if (!contextText.trim()) {
      return "Không tìm thấy dữ liệu phù hợp trong bộ tri thức nội bộ để trả lời.";
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${currentKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Bạn là một trợ lý ảo thông minh chuyên gia xử lý dữ liệu RAG. Nhiệm vụ của bạn là trả lời câu hỏi của người dùng dựa TRÊN DUY NHẤT các tài liệu tham khảo được cung cấp dưới đây. \n---\nTÀI LIỆU THAM KHẢO NỀN TẢNG:\n${contextText}\n---\nYÊU CẦU NGHIÊM NGẶT:\n1. Trả lời một cách chuẩn chỉ, khách quan, ngắn gọn nhưng đầy đủ ý.\n2. Chỉ sử dụng thông tin có trong tài liệu được cung cấp. Tuyệt đối không tự suy diễn hoặc bịa đặt thông tin nằm ngoài ngữ cảnh (không ảo tưởng).\n3. Nếu tài liệu được cung cấp không chứa thông tin hoặc không đủ dữ liệu để trả lời câu hỏi, hãy phản hồi trung thực: "Dựa trên bộ tri thức hiện tại, hệ thống không tìm thấy đủ dữ liệu để trả lời câu hỏi này." và tuyệt đối không cố gắng tự trả lời.`
          },
          {
            role: "user",
            content: question
          }
        ],
        temperature: 0.5,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Lỗi kết nối Groq API (Mã lỗi: ${response.status})`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Không nhận được phản hồi hợp lệ từ mô hình.";
  };

  // Hàm xử lý tìm kiếm hỗn hợp và tổng hợp kết quả
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKB || !query.trim()) return;

    setLoading(true);
    setResults([]);
    setLlmResponse("");

    try {
      // Đọc tất cả các chunks gốc từ OPFS
      let allChunksData = await readJsonFromOPFS<any>(selectedKB, "chunks.json");
      
      if (!allChunksData) {
        throw new Error("Không tìm thấy tệp chunks.json của bộ tri thức này.");
      }

      if (typeof allChunksData === "string") {
        allChunksData = JSON.parse(allChunksData);
      }

      const chunksArray: any[] = Array.isArray(allChunksData)
        ? allChunksData
        : (allChunksData.chunks || allChunksData.data || []);

      if (chunksArray.length === 0) {
        throw new Error("Không trích xuất được danh sách mảng dữ liệu.");
      }

      const chunkMap = new Map<string, StoredChunk>();
      chunksArray.forEach((item: any) => {
        const chunkObj = item.chunk || item; 
        if (chunkObj?.metadata?.chunkId) {
          chunkMap.set(chunkObj.metadata.chunkId, chunkObj);
        }
      });

      // Thực hiện BM25 Search
      const bm25Engine = await initializeSearchFromStorage(selectedKB);
      let bm25Results: any[] = [];
      if (bm25Engine) {
        bm25Results = bm25Engine.search(query, 10); 
      }

      // Thực hiện Vector Search ---
      const queryEmbedding = await generateQueryEmbedding(query);
      const vectorIndex = await getVectorIndexFromStorage(selectedKB);
      
      const vectorScores = vectorIndex.map((item) => {
        const similarity = cosineSimilarity(queryEmbedding, item.embedding);
        return {
          chunkId: item.chunkId,
          score: similarity,
          chunk: chunkMap.get(item.chunkId) 
        };
      });

      const topVectorResults = vectorScores
        .sort((a, b) => b.score - a.score)
        .filter(item => item.score > 0)
        .slice(0, 10);

      // RRF Hybrid Fusion
      const fused = fuseResults(bm25Results, topVectorResults, 60);

      const finalResults = fused.map((res: any) => {
        const chunkId = res.chunk?.metadata?.chunkId || res.chunkId;
        return {
          chunk: res.chunk || chunkMap.get(chunkId),
          score: res.score,
          type: res.type
        };
      }).filter(item => item.chunk) as HybridResultItem[];

      setResults(finalResults);

      // Sinh câu trả lời thông qua cấu hình Groq
      if (finalResults.length > 0) {
        const answer = await generateFinalAnswer(query, finalResults);
        setLlmResponse(answer);
      }

    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    knowledgeBases,
    selectedKB,
    setSelectedKB,
    query,
    setQuery,
    loading,
    apiKey,
    setApiKey,
    showKey,
    setShowKey,
    results,
    llmResponse,
    handleSearch
  };
}
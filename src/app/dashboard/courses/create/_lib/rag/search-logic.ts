
/**
 * Lớp logic xử lý truy vấn, tìm kiếm và tương tác với hệ thống tệp trình duyệt.
 * File này tách biệt hoàn toàn phần tính toán với giao diện người dùng.
 */

// --- Interfaces ---
export interface VectorIndexItem {
  chunkId: string;
  embedding: number[];
}

export interface StoredChunk {
  content: string;
  metadata: {
    chunkId: string;
    headings: string[];
  };
}

// --- Logic Truy xuất dữ liệu (Data Access) ---
export async function readJsonFromOPFS<T>(folderName: string, fileName: string): Promise<T | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const knowledgeHandle = await root.getDirectoryHandle("knowledge");
    const folderHandle = await knowledgeHandle.getDirectoryHandle(folderName);
    const fileHandle = await folderHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    const content = await file.text();
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Lỗi khi đọc file ${fileName} từ thư mục ${folderName}:`, error);
    return null;
  }
}

// --- Logic Tìm kiếm Ngữ nghĩa (Vector Search Logic) ---

/**
 * Tính toán độ tương đồng Cosine giữa hai vector.
 * Trả về giá trị trong khoảng [-1, 1], càng gần 1 càng tương đồng cao.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

/**
 * Sử dụng model local (Transformers.js) chạy trên trình duyệt để chuyển văn bản thành vector.
 * Ưu điểm: Bảo mật dữ liệu và không tốn phí API embedding.
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const { pipeline, env } = await import('@huggingface/transformers');
  
  // Cấu hình để chạy hoàn toàn trên trình duyệt
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  
  return Array.from(output.data as Float32Array);
}

// --- Logic Hợp nhất Kết quả (Hybrid Fusion Logic) ---

/**
 * Thuật toán Hợp nhất Kết quả (Reciprocal Rank Fusion - RRF).
 * Kết hợp xếp hạng từ BM25 (từ khóa) và Vector Search (ngữ nghĩa).
 * @param k - Hằng số làm mượt xếp hạng (mặc định 60).
 */
export function fuseResults(bm25Results: any[], vectorResults: any[], k = 60) {
  const scoreMap = new Map<string, { chunk: StoredChunk; score: number; type: string }>();

  const updateScore = (results: any[], type: "bm25" | "vector") => {
    results.forEach((res, rank) => {
      // Xác định chunkId từ các cấu trúc dữ liệu khác nhau
      const chunkId = res.chunk?.metadata?.chunkId || res.chunkId;
      if (!chunkId) return;

      const current = scoreMap.get(chunkId) || { 
        chunk: res.chunk, 
        score: 0, 
        type: "hybrid" 
      };
      
      // Công thức RRF: Điểm = 1 / (k + rank + 1)
      current.score += 1 / (k + rank + 1);
      scoreMap.set(chunkId, current);
    });
  };

  updateScore(bm25Results, "bm25");
  updateScore(vectorResults, "vector");

  // Chuyển Map thành mảng, sắp xếp theo điểm cao nhất và lấy top 5
  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
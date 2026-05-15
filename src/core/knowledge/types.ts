// core/knowledge/types.ts

export type DocumentType = "pdf" | "markdown" | "txt";

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: DocumentType;
  content: string;            // raw text đã extract
  sizeBytes: number;
  uploadedAt: number;
  chunkCount: number;
  status: "pending" | "indexing" | "ready" | "error";
  errorMessage?: string;
}

export interface DocumentChunk {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  index: number;              // thứ tự chunk trong document
  startChar: number;
  endChar: number;
}

export interface ChunkEmbedding {
  chunkId: string;
  documentId: string;
  vector: number[];           // embedding vector
  model: string;              // model tạo ra embedding
}

export interface RetrievalResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  score: number;              // 0-1, higher = more relevant
  retrievalMethod: "vector" | "bm25" | "hybrid";
}

export interface RetrievalOptions {
  query: string;
  topK?: number;
  knowledgeBaseId?: string;
  minScore?: number;
}
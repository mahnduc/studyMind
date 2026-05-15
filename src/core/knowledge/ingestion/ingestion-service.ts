// core/knowledge/ingestion/ingestion-service.ts
// MÔ TẢ: Orchestrate pipeline: load → chunk → embed → store

import { documentLoader } from "./document-loader";
import { markdownChunker } from "./markdown-chunker";
import { embeddingService } from "./embedding-service";
import { KnowledgeDocument } from "../types";
import { knowledgeStorageRepository } from "@/core/storage/repositories/knowledge.repository";

export type IngestionProgress = {
  stage: "loading" | "chunking" | "embedding" | "saving" | "done" | "error";
  message: string;
  documentId?: string;
};

export const ingestionService = {
  /**
   * Pipeline hoàn chỉnh: File → indexed chunks + embeddings
   * onProgress: callback cập nhật tiến độ cho UI
   */
  async ingest(
    file: File,
    onProgress?: (progress: IngestionProgress) => void
  ): Promise<KnowledgeDocument> {
    const emit = (p: IngestionProgress) => onProgress?.(p);

    // 1. Load & extract text
    emit({ stage: "loading", message: `Đang đọc file: ${file.name}` });
    let doc: KnowledgeDocument;
    try {
      doc = await documentLoader.load(file);
    } catch (err) {
      emit({ stage: "error", message: `Lỗi đọc file: ${err instanceof Error ? err.message : String(err)}` });
      throw err;
    }

    // 2. Lưu document metadata (status: indexing)
    doc.status = "indexing";
    await knowledgeStorageRepository.saveDocument(doc);
    emit({ stage: "chunking", message: "Đang phân tích và chia nhỏ nội dung...", documentId: doc.id });

    // 3. Chunk
    let chunks;
    try {
      chunks = markdownChunker.chunk(doc.id, doc.name, doc.content, {
        chunkSize: 800,
        chunkOverlap: 100,
        splitByHeading: doc.type === "markdown",
      });
      await knowledgeStorageRepository.saveChunks(chunks);
    } catch (err) {
      await knowledgeStorageRepository.updateDocumentStatus(doc.id, "error", {
        errorMessage: `Lỗi chunking: ${err instanceof Error ? err.message : String(err)}`,
      });
      throw err;
    }

    // 4. Embed
    emit({
      stage: "embedding",
      message: `Đang tạo embeddings cho ${chunks.length} đoạn văn...`,
      documentId: doc.id,
    });
    try {
      const embeddings = await embeddingService.embedChunks(chunks);
      await knowledgeStorageRepository.saveEmbeddings(embeddings);
    } catch (err) {
      // Embedding thất bại không chặn hoàn toàn - vẫn dùng được BM25
      console.warn("[IngestionService] Embedding thất bại, BM25 vẫn hoạt động:", err);
    }

    // 5. Cập nhật status → ready
    await knowledgeStorageRepository.updateDocumentStatus(doc.id, "ready", {
      chunkCount: chunks.length,
    });
    doc.status = "ready";
    doc.chunkCount = chunks.length;

    emit({
      stage: "done",
      message: `✅ Đã index "${doc.name}" (${chunks.length} đoạn)`,
      documentId: doc.id,
    });

    return doc;
  },

  /**
   * Xóa document và tất cả chunks/embeddings liên quan
   */
  async delete(documentId: string): Promise<void> {
    await knowledgeStorageRepository.deleteDocument(documentId);
  },
};
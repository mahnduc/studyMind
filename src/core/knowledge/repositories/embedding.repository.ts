// core/knowledge/repositories/embedding.repository.ts

import { knowledgeStorageRepository } from "@/core/storage/repositories/knowledge.repository";
import { ChunkEmbedding } from "../types";

export const embeddingRepository = {
  async getAll(): Promise<ChunkEmbedding[]> {
    return knowledgeStorageRepository.getAllEmbeddings();
  },

  async getByDocumentId(documentId: string): Promise<ChunkEmbedding[]> {
    return knowledgeStorageRepository.getEmbeddingsByDocumentId(documentId);
  },

  async save(embeddings: ChunkEmbedding[]): Promise<void> {
    return knowledgeStorageRepository.saveEmbeddings(embeddings);
  },
};
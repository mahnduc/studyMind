// core/knowledge/repositories/chunk.repository.ts

import { knowledgeStorageRepository } from "@/core/storage/repositories/knowledge.repository";
import { DocumentChunk } from "../types";

export const chunkRepository = {
  async getByDocumentId(documentId: string): Promise<DocumentChunk[]> {
    return knowledgeStorageRepository.getChunksByDocumentId(documentId);
  },

  async getAll(): Promise<DocumentChunk[]> {
    return knowledgeStorageRepository.getAllChunks();
  },
};
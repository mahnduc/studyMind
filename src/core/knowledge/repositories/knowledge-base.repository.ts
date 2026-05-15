// core/knowledge/repositories/knowledge-base.repository.ts
// MÔ TẢ: Facade repository cho knowledge documents

import { knowledgeStorageRepository } from "@/core/storage/repositories/knowledge.repository";
import { KnowledgeDocument } from "../types";

export const knowledgeBaseRepository = {
  async getById(id: string): Promise<(KnowledgeDocument & { content: string }) | null> {
    return knowledgeStorageRepository.getDocumentById(id);
  },

  async getByName(name: string): Promise<(KnowledgeDocument & { content: string }) | null> {
    const docs = await knowledgeStorageRepository.listDocuments();
    const found = docs.find((d) => d.name === name || d.name.includes(name));
    if (!found) return null;
    return knowledgeStorageRepository.getDocumentById(found.id);
  },

  async list(): Promise<KnowledgeDocument[]> {
    return knowledgeStorageRepository.listDocuments();
  },

  async delete(id: string): Promise<void> {
    return knowledgeStorageRepository.deleteDocument(id);
  },
};
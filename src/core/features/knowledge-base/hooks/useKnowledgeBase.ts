// core/features/knowledge-base/hooks/useKnowledgeBase.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { ingestionService, IngestionProgress } from "../../../knowledge/ingestion/ingestion-service";
import { knowledgeBaseRepository } from "../../../knowledge/repositories/knowledge-base.repository";
import { KnowledgeDocument } from "../../../knowledge/types";

export interface UseKnowledgeBaseReturn {
  documents: KnowledgeDocument[];
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: IngestionProgress | null;
  error: string | null;
  upload: (file: File) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useKnowledgeBase(): UseKnowledgeBaseReturn {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<IngestionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const docs = await knowledgeBaseRepository.list();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách tài liệu");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const upload = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(null);
    try {
      await ingestionService.ingest(file, (progress) => {
        setUploadProgress(progress);
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [refresh]);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await ingestionService.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa thất bại");
    }
  }, []);

  return { documents, isLoading, isUploading, uploadProgress, error, upload, deleteDocument, refresh };
}
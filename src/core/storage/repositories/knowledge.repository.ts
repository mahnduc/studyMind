// FILE: core/storage/repositories/knowledge.repository.ts
// MÔ TẢ: SQL persistence cho knowledge documents và chunks

import { pgliteAdapter } from "../pglite.adapter";
import { KnowledgeDocument, DocumentChunk, ChunkEmbedding } from "../../knowledge/types";

export const knowledgeStorageRepository = {
  // ── Documents ───────────────────────────────────────────

  async saveDocument(doc: KnowledgeDocument): Promise<void> {
    await pgliteAdapter.exec(
      `INSERT INTO knowledge_documents
         (id, name, type, content, size_bytes, uploaded_at, chunk_count, status, error_message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         status = $8, chunk_count = $7, error_message = $9`,
      [doc.id, doc.name, doc.type, doc.content, doc.sizeBytes,
       doc.uploadedAt, doc.chunkCount, doc.status, doc.errorMessage ?? null]
    );
  },

  async updateDocumentStatus(
    id: string,
    status: KnowledgeDocument["status"],
    extra?: { chunkCount?: number; errorMessage?: string }
  ): Promise<void> {
    await pgliteAdapter.exec(
      `UPDATE knowledge_documents
       SET status = $2, chunk_count = COALESCE($3, chunk_count), error_message = $4
       WHERE id = $1`,
      [id, status, extra?.chunkCount ?? null, extra?.errorMessage ?? null]
    );
  },

  async listDocuments(): Promise<KnowledgeDocument[]> {
    const res = await pgliteAdapter.query<{
      id: string; name: string; type: string; content: string;
      size_bytes: number; uploaded_at: number; chunk_count: number;
      status: string; error_message: string;
    }>(`SELECT * FROM knowledge_documents ORDER BY uploaded_at DESC`);

    return res.rows.map((r) => ({
      id: r.id, name: r.name, type: r.type as KnowledgeDocument["type"],
      content: r.content, sizeBytes: r.size_bytes, uploadedAt: r.uploaded_at,
      chunkCount: r.chunk_count, status: r.status as KnowledgeDocument["status"],
      errorMessage: r.error_message ?? undefined,
    }));
  },

  async getDocumentById(id: string): Promise<KnowledgeDocument | null> {
    const res = await pgliteAdapter.query<{
      id: string; name: string; type: string; content: string;
      size_bytes: number; uploaded_at: number; chunk_count: number;
      status: string; error_message: string;
    }>(`SELECT * FROM knowledge_documents WHERE id = $1`, [id]);
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id, name: r.name, type: r.type as KnowledgeDocument["type"],
      content: r.content, sizeBytes: r.size_bytes, uploadedAt: r.uploaded_at,
      chunkCount: r.chunk_count, status: r.status as KnowledgeDocument["status"],
      errorMessage: r.error_message ?? undefined,
    };
  },

  async deleteDocument(id: string): Promise<void> {
    await pgliteAdapter.exec(
      `DELETE FROM knowledge_documents WHERE id = $1`, [id]
    );
  },

  // ── Chunks ──────────────────────────────────────────────

  async saveChunks(chunks: DocumentChunk[]): Promise<void> {
    for (const c of chunks) {
      await pgliteAdapter.exec(
        `INSERT INTO document_chunks
           (chunk_id, document_id, document_name, content, chunk_index, start_char, end_char)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (chunk_id) DO NOTHING`,
        [c.chunkId, c.documentId, c.documentName, c.content, c.index, c.startChar, c.endChar]
      );
    }
  },

  async getChunksByDocumentId(documentId: string): Promise<DocumentChunk[]> {
    const res = await pgliteAdapter.query<{
      chunk_id: string; document_id: string; document_name: string;
      content: string; chunk_index: number; start_char: number; end_char: number;
    }>(
      `SELECT * FROM document_chunks WHERE document_id = $1 ORDER BY chunk_index`,
      [documentId]
    );
    return res.rows.map((r) => ({
      chunkId: r.chunk_id, documentId: r.document_id,
      documentName: r.document_name, content: r.content,
      index: r.chunk_index, startChar: r.start_char, endChar: r.end_char,
    }));
  },

  async getAllChunks(): Promise<DocumentChunk[]> {
    const res = await pgliteAdapter.query<{
      chunk_id: string; document_id: string; document_name: string;
      content: string; chunk_index: number; start_char: number; end_char: number;
    }>(`SELECT * FROM document_chunks ORDER BY document_id, chunk_index`);
    return res.rows.map((r) => ({
      chunkId: r.chunk_id, documentId: r.document_id,
      documentName: r.document_name, content: r.content,
      index: r.chunk_index, startChar: r.start_char, endChar: r.end_char,
    }));
  },

  // ── Embeddings ──────────────────────────────────────────

  async saveEmbeddings(embeddings: ChunkEmbedding[]): Promise<void> {
    for (const e of embeddings) {
      await pgliteAdapter.exec(
        `INSERT INTO chunk_embeddings (chunk_id, document_id, vector, model)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (chunk_id) DO UPDATE SET vector = $3`,
        [e.chunkId, e.documentId, JSON.stringify(e.vector), e.model]
      );
    }
  },

  async getAllEmbeddings(): Promise<ChunkEmbedding[]> {
    const res = await pgliteAdapter.query<{
      chunk_id: string; document_id: string; vector: string; model: string;
    }>(`SELECT chunk_id, document_id, vector, model FROM chunk_embeddings`);
    return res.rows.map((r) => ({
      chunkId: r.chunk_id, documentId: r.document_id,
      vector: JSON.parse(r.vector) as number[], model: r.model,
    }));
  },

  async getEmbeddingsByDocumentId(documentId: string): Promise<ChunkEmbedding[]> {
    const res = await pgliteAdapter.query<{
      chunk_id: string; document_id: string; vector: string; model: string;
    }>(
      `SELECT chunk_id, document_id, vector, model FROM chunk_embeddings WHERE document_id = $1`,
      [documentId]
    );
    return res.rows.map((r) => ({
      chunkId: r.chunk_id, documentId: r.document_id,
      vector: JSON.parse(r.vector) as number[], model: r.model,
    }));
  },
};
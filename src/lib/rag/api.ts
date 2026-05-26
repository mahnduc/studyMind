// lib/data-ingestion/api.ts

import { MarkdownChunker, ProcessedChunk } from "./markdownChunker";
import { BM25Search } from "./BM25Search";
import { convertDocxToMdInOPFS } from "./docx2md";

/**
 * Interface cho dữ liệu Vector được lưu trữ
 */
interface VectorIndexItem {
  chunkId: string;
  embedding: number[];
}

export interface OPFSResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Hàm tạo Embedding sử dụng Hugging Face (Transformers.js)
 * Chạy hoàn toàn ở Client-side (Trình duyệt)
 */
async function generateEmbeddings(chunks: ProcessedChunk[]): Promise<number[][]> {
  try {
    const { pipeline, env } = await import('@huggingface/transformers');

    env.allowLocalModels = false;
    env.useBrowserCache = true;

    const extractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );

    const embeddings: number[][] = [];

    for (const chunk of chunks) {
      const contextText =
        `Context: ${chunk.metadata.headings.join(' > ')}\n\n${chunk.content}`;

      const output = await extractor(contextText, {
        pooling: 'mean',
        normalize: true,
      });

      embeddings.push(Array.from(output.data as Float32Array));
    }

    return embeddings;
  } catch (error) {
    console.error('Lỗi khi tạo Embedding:', error);
    throw new Error('Không thể khởi tạo hoặc chạy model Embedding.');
  }
}

/**
 * Lấy danh sách tất cả các bộ tri thức (thư mục con trong /knowledge)
 */
export async function getAllKnowledgeBases(): Promise<string[]> {
  try {
    const root = await navigator.storage.getDirectory();
    const knowledgeHandle = await root.getDirectoryHandle('knowledge', { create: true });
    const folders: string[] = [];
    
    // @ts-ignore - Duyệt entries trong OPFS
    for await (const [name, handle] of knowledgeHandle.entries()) {
      if (handle.kind === 'directory') {
        folders.push(name);
      }
    }
    return folders;
  } catch (error) {
    console.error("Lỗi khi quét danh sách bộ tri thức:", error);
    return [];
  }
}

/**
 * Core Task: Xử lý Markdown -> Chunking -> BM25 -> Embedding -> Lưu trữ OPFS
 */
async function runTask(filePath: string): Promise<string> {
  const chunker = new MarkdownChunker(600, 100);

  try {
    const fileName = filePath.split('/').pop() || 'unknown.md';
    const folderName = fileName; 
    const saveFileName = `chunks.json`;
    const indexFileName = `bm25_index.json`;
    const vectorFileName = `vector_index.json`;

    // 1. Phân tách Markdown thành các chunks
    const chunks = await chunker.processMarkdown(filePath);
    const chunkForSave = await chunker.exportToJSON(chunks);

    // 2. Tạo Vector Embeddings (Sử dụng model Xenova/all-MiniLM-L6-v2)
    const embeddings = await generateEmbeddings(chunks);
    const vectorIndex: VectorIndexItem[] = chunks.map((chunk, index) => ({
      chunkId: chunk.metadata.chunkId,
      embedding: embeddings[index]
    }));

    // 3. Khởi tạo cấu trúc thư mục trong OPFS
    const root = await navigator.storage.getDirectory();
    const knowledgeHandle = await root.getDirectoryHandle('knowledge', { create: true });
    const folderHandle = await knowledgeHandle.getDirectoryHandle(folderName, { create: true });

    // 4. Lưu file Chunks (Dữ liệu gốc và Metadata)
    const chunkFileHandle = await folderHandle.getFileHandle(saveFileName, { create: true });
    const chunkWritable = await chunkFileHandle.createWritable();
    await chunkWritable.write(chunkForSave);
    await chunkWritable.close();

    // 5. Tạo và lưu BM25 Index (Dành cho Keyword Search)
    const searchEngine = new BM25Search(1.5, 0.75);
    searchEngine.indexChunks(chunks);
    const indexData = searchEngine.exportIndex();
    
    const indexFileHandle = await folderHandle.getFileHandle(indexFileName, { create: true });
    const indexWritable = await indexFileHandle.createWritable();
    const indexContent = typeof indexData === 'string' ? indexData : JSON.stringify(indexData);
    await indexWritable.write(indexContent);
    await indexWritable.close();

    // 6. Lưu Vector Index (Dành cho Semantic Search)
    const vectorFileHandle = await folderHandle.getFileHandle(vectorFileName, { create: true });
    const vectorWritable = await vectorFileHandle.createWritable();
    await vectorWritable.write(JSON.stringify(vectorIndex));
    await vectorWritable.close();

    return "ok";
  } catch (error) {
    console.error("Lỗi trong quá trình Ingestion:", error);
    throw error;
  }
}

/**
 * Hàm bổ trợ đọc file từ OPFS
 */
async function readFromOPFS(folderName: string, fileName: string): Promise<any> {
  try {
    const root = await navigator.storage.getDirectory();
    const knowledgeHandle = await root.getDirectoryHandle('knowledge');
    const folderHandle = await knowledgeHandle.getDirectoryHandle(folderName);
    const fileHandle = await folderHandle.getFileHandle(fileName);
    
    const file = await fileHandle.getFile();
    const content = await file.text();
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Khởi tạo BM25 Search từ bộ nhớ lưu trữ
 */
export async function initializeSearchFromStorage(folderName: string): Promise<BM25Search | null> {
  const indexData = await readFromOPFS(folderName, "bm25_index.json");
  if (!indexData) return null;

  const searchEngine = new BM25Search();
  searchEngine.importIndex(indexData);
  return searchEngine;
}

/**
 * Truy xuất Vector Index từ OPFS
 */
export async function getVectorIndexFromStorage(folderName: string): Promise<VectorIndexItem[]> {
  const vectorData = await readFromOPFS(folderName, "vector_index.json");
  return vectorData || [];
}

/**
 * API chính để đẩy dữ liệu vào hệ thống RAG
 */

export async function ingestFromPath(filePath: string): Promise<OPFSResponse> {
  try {
    const lowerPath = filePath.toLowerCase();
    let targetFilePath = filePath;

    // 1. Kiểm tra định dạng và xử lý nếu là file .docx
    if (lowerPath.endsWith('.docx')) {
      targetFilePath = await convertDocxToMdInOPFS(filePath);
    } else if (!lowerPath.endsWith('.md')) {
      // Nếu không phải .md cũng không phải .docx thì báo lỗi
      return {
        success: false,
        error: `Định dạng tệp tin không hợp lệ. Hệ thống hỗ trợ xử lý tài liệu định dạng Markdown (.md) và Word (.docx).`
      };
    }

    // 2. Chạy tác vụ xử lý Hybrid Search với file .md (gốc hoặc sau khi chuyển đổi)
    await runTask(targetFilePath);
    
    return {
      success: true,
      message: `Tài liệu đã được xử lý Hybrid Search (Keyword + Semantic) và lưu trữ thành công.`
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Lỗi xử lý dữ liệu." };
  }
}
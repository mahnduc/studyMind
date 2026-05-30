'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Search, 
  Volume2, 
  BookOpen, 
  Plus, 
  Check, 
  Loader2, 
  Sparkles, 
  ArrowLeft, 
  MessageSquareText
} from 'lucide-react';
import { useDictionary } from '../../../../hooks/useDictionary';
import { useCollection } from '@/hooks/useCollection';
import { useHybridSearch } from '@/hooks/useHybridSearch';

interface FileViewerProps {
  fileName: string;
  onClose?: () => void;
}

type SidebarMode = 'dictionary' | 'rag';

export const FileViewer: React.FC<FileViewerProps> = ({ fileName, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [fileLoading, setFileLoading] = useState<boolean>(true);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSavingWord, setIsSavingWord] = useState<boolean>(false);
  
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('dictionary');

  // Hook 1: Tra từ điển cá nhân
  const {
    searchTerm,
    setSearchTerm,
    setActiveWord,
    results: dictResults,
    loading: dictLoading,
    error: dictError,
    isSaved,
    setIsSaved,
    playAudio,
  } = useDictionary();

  // Hook 2: Tìm kiếm hỗn hợp RAG (Hybrid Search)
  const {
    setSelectedKB,
    query,
    setQuery,
    loading: ragLoading,
    llmResponse,
    handleSearch: handleRagSearch
  } = useHybridSearch();

  const { handleSaveDirectToCollection } = useCollection();

  // Đồng bộ hóa tên thư mục tri thức (bỏ đuôi .md)
  useEffect(() => {
    if (fileName) {
      const folderName = fileName.replace(/\.[^/.]+$/, "");
      setSelectedKB(folderName);
    }
  }, [fileName, setSelectedKB]);

  // Đọc nội dung file từ OPFS kiến trúc Local-first
  useEffect(() => {
    let isMounted = true;
    async function readFileFromOPFS() {
      if (!fileName) return;
      setFileLoading(true);
      setFileError(null);
      try {
        const folderName = fileName.replace(/\.[^/.]+$/, "");
        const root = await navigator.storage.getDirectory();
        const knowledgeHandle = await root.getDirectoryHandle('knowledge', { create: false });
        const folderHandle = await knowledgeHandle.getDirectoryHandle(folderName, { create: false });
        
        const chunkFileHandle = await folderHandle.getFileHandle('chunks.json', { create: false });
        const file = await chunkFileHandle.getFile();
        const text = await file.text();

        if (isMounted) {
          try {
            const parsedData = JSON.parse(text);
            const chunksArray = Array.isArray(parsedData)
              ? parsedData
              : (parsedData.chunks || parsedData.data || []);

            if (chunksArray.length > 0) {
              const fullContent = chunksArray
                .map((item: any) => {
                  const chunkObj = item.chunk || item;
                  return chunkObj.content || '';
                })
                .join('\n\n');
              setContent(fullContent);
            } else {
              setContent(text);
            }
          } catch (jsonErr) {
            setContent(text);
          }
          setFileLoading(false);
        }
      } catch (err: any) {
        console.error(`Lỗi khi đọc file từ OPFS:`, err);
        if (isMounted) {
          setFileError(err.message || 'Không thể đọc dữ liệu bộ tri thức.');
          setFileLoading(false);
        }
      }
    }
    readFileFromOPFS();
    return () => { isMounted = false; };
  }, [fileName]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (selectedText && selectedText.length > 0) {
      if (sidebarMode === 'dictionary' && selectedText.length < 30) {
        const cleanWord = selectedText.replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"']+|[.,\/#!$%\^&\*;:{}=\-_`~()?"']+/g, '');
        if (cleanWord) setSearchTerm(cleanWord);
      } else if (sidebarMode === 'rag') {
        setQuery(selectedText);
      }
    }
  };

  const handleDictionarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) setActiveWord(searchTerm.trim());
  };

  const handleSaveToCollection = async (word: string, data: any) => {
    if (!word || !data) return;
    setIsSavingWord(true);
    try {
      const targetCollectionName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "Bộ sưu tập chung";
      await handleSaveDirectToCollection(targetCollectionName, word, data);
      setIsSaved(true);
    } catch (err) {
      console.error(err);
    } finally { setIsSavingWord(false); }
  };

  if (fileLoading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 border-indigo-500 animate-spin" />
        <p className="text-xs font-semibold">Đang nạp cấu trúc bộ tri thức local...</p>
      </div>
    );
  }

  if (fileError) {
    return (
      <div className="w-full max-w-2xl mx-auto my-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs">
        <p className="font-bold">Hệ thống OPFS lỗi:</p>
        <p className="mt-0.5 text-gray-600 font-medium">{fileError}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen max-h-screen bg-[#F8FAFC] text-gray-800 antialiased selection:bg-indigo-100 flex flex-col lg:flex-row overflow-hidden">
      
      {/* KHUNG TRÁI: Nội dung văn bản gốc (72%) */}
      <div className="w-full lg:w-[72%] bg-white border-r border-gray-100 overflow-y-auto h-full flex flex-col" onMouseUp={handleTextSelection}>
        <article className="w-full max-w-3xl mx-auto px-6 sm:px-8 py-6 flex-1 min-h-full">
          <header className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            {onClose && (
              <button onClick={onClose} className="p-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-lg transition-all border border-gray-200/50 cursor-pointer group shrink-0">
                <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 rounded bg-indigo-50/70 px-2 py-0.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                <span>{fileName}</span>
                <span className="text-indigo-300">•</span>
                <span className="text-gray-400 normal-case font-medium">Bôi đen văn bản để tra cứu hoặc đưa vào Prompt</span>
              </div>
            </div>
          </header>
          <div className="w-full">
            {fileName.endsWith('.md') ? (
              <div className="prose prose-slate prose-sm max-w-none prose-headings:font-bold prose-headings:text-gray-950 prose-p:leading-relaxed prose-pre:bg-gray-50 prose-pre:text-gray-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            ) : (
              <pre className="font-mono text-xs leading-relaxed p-5 bg-gray-50 rounded-xl overflow-x-auto border border-gray-100 text-gray-700 whitespace-pre-wrap break-all">{content}</pre>
            )}
          </div>
        </article>
      </div>

      {/* KHUNG PHẢI: Sidebar Dashboard tối ưu không gian (28%) */}
      <div className="w-full lg:w-[28%] bg-[#F8FAFC] flex flex-col h-full overflow-hidden border-t lg:border-t-0 border-gray-200/60">
        
        {/* TAB CONTROLLER */}
        <div className="p-3 bg-white border-b border-gray-100 shrink-0">
          <div className="flex bg-gray-100/80 p-0.5 rounded-lg border border-gray-200/30">
            <button 
              onClick={() => setSidebarMode('dictionary')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                sidebarMode === 'dictionary' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <BookOpen size={12} />
              Từ điển
            </button>
            <button 
              onClick={() => setSidebarMode('rag')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                sidebarMode === 'rag' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <MessageSquareText size={12} />
              Hỏi đáp RAG AI
            </button>
          </div>
        </div>

        {/* --- SIDEBAR CHẾ ĐỘ 1: TỪ ĐIỂN --- */}
        {sidebarMode === 'dictionary' && (
          <>
            <div className="p-3 bg-white border-b border-gray-100 shrink-0">
              <form onSubmit={handleDictionarySubmit} className="relative flex items-center">
                <input type="text" placeholder="Nhập từ mới hoặc quét khối văn bản..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-3 pr-8 py-1.5 bg-gray-50 text-xs font-semibold rounded-lg border border-gray-200/60 focus:outline-hidden focus:border-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400" />
                <button type="submit" className="absolute right-1.5 p-1 text-gray-400 hover:text-indigo-600 cursor-pointer">
                  <Search size={13} />
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {dictLoading && (
                <div className="bg-white rounded-xl p-5 text-center border border-gray-100 flex-1 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md animate-pulse">Groq LLM Engine đang phân tích...</span>
                </div>
              )}
              
              {!dictLoading && !dictResults && (
                <div className="text-center text-gray-400 text-[10px] font-medium py-12 border border-dashed border-gray-200 bg-white rounded-xl mx-1">
                  Quét nhanh cụm từ bên màn hình đọc để tra cứu tự động.
                </div>
              )}
              
              {!dictLoading && dictResults && dictResults.map((entry, index) => (
                <div key={index} className="w-full bg-white rounded-xl border border-gray-100 shadow-3xs p-3 flex flex-col gap-2.5 animate-fade-in shrink-0">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-1.5">
                    <div className="min-w-0">
                      <h2 className="text-sm font-black text-gray-900 truncate capitalize tracking-tight">{entry.word}</h2>
                      {entry.phonetics?.[0]?.text && <p className="text-[9px] font-mono text-indigo-600">{entry.phonetics[0].text}</p>}
                    </div>
                    <button onClick={() => playAudio(entry.word)} className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md transition-all cursor-pointer">
                      <Volume2 size={12} />
                    </button>
                  </div>
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-0.5">
                    {entry.ai?.partsOfSpeech?.map((pos, pIdx) => (
                      <div key={pIdx} className="space-y-1 border-b border-gray-50/60 pb-2 last:border-0 last:pb-0">
                        <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded-sm inline-block">{pos.partOfSpeech}</span>
                        <p className="text-xs font-bold text-gray-800 leading-tight">{pos.definitionVi}</p>
                        {pos.examples?.slice(0, 1).map((ex, eIdx) => (
                          <p key={eIdx} className="text-[10px] font-medium text-gray-400 italic">“{ex.en}”: {ex.vi}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                  <button disabled={isSaved || isSavingWord} onClick={() => handleSaveToCollection(entry.word, entry)} className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${isSaved ? 'bg-emerald-50 text-emerald-600 cursor-not-allowed border border-emerald-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                    {isSavingWord ? <Loader2 size={10} className="animate-spin" /> : isSaved ? <Check size={10} strokeWidth={3} /> : <Plus size={10} strokeWidth={3} />}
                    {isSaved ? 'Đã lưu bộ từ' : 'Lưu vào BST'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* --- SIDEBAR CHẾ ĐỘ 2: HỎI ĐÁP TÀI LIỆU (RAG) - TỐI GIẢN TOÀN DIỆN --- */}
        {sidebarMode === 'rag' && (
          <>
            <div className="p-3 bg-white border-b border-gray-100 shrink-0">
              <form onSubmit={handleRagSearch} className="relative flex items-center">
                <input 
                  type="text" 
                  placeholder="Hỏi về nội dung tài liệu..." 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  className="w-full pl-3 pr-8 py-1.5 bg-gray-50 text-xs font-semibold rounded-lg border border-gray-200/60 focus:outline-hidden focus:border-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400" 
                />
                <button type="submit" disabled={ragLoading || !query.trim()} className="absolute right-1.5 p-1 text-gray-400 hover:text-indigo-600 cursor-pointer disabled:opacity-30">
                  <Search size={13} />
                </button>
              </form>
            </div>

            {/* Khung chứa kết quả: Tận dụng flex-1 và overflow-y-auto để cuộn mượt mà */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              
              {ragLoading && (
                <div className="bg-white rounded-xl p-6 text-center border border-gray-100 flex-1 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded animate-pulse">
                    <Sparkles size={10} />
                    Đang đối chiếu dữ liệu kiến thức...
                  </div>
                </div>
              )}

              {!ragLoading && !llmResponse && (
                <div className="text-center text-gray-400 text-[10px] font-medium py-12 border border-dashed border-gray-200 bg-white rounded-xl mx-1 flex-1 flex flex-col items-center justify-center">
                  <p>Đặt câu hỏi phân tích tài liệu.</p>
                  <p className="text-[9px] text-gray-300 mt-0.5">Mô hình cục bộ xử lý trực tiếp trên browser.</p>
                </div>
              )}

              {/* KHỐI PHẢN HỒI AI TOÀN DIỆN: Đã gỡ bỏ giới hạn chiều cao cố định */}
              {!ragLoading && llmResponse && (
                <div className="w-full bg-white rounded-xl border border-indigo-100/70 shadow-3xs p-3.5 flex flex-col gap-2.5 animate-fade-in flex-1 min-h-0">
                  <div className="flex items-center gap-1.5 border-b border-gray-50 pb-2 shrink-0">
                    <div className="p-1 bg-indigo-50 rounded-md text-indigo-600">
                      <Sparkles size={11} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-900">Trợ lý AI phản hồi:</span>
                  </div>
                  
                  {/* Nội dung chiếm trọn không gian trống và tự cuộn khi câu trả lời quá dài */}
                  <div className="text-xs font-medium text-gray-700 leading-relaxed overflow-y-auto pr-1 whitespace-pre-line flex-1">
                    {llmResponse}
                  </div>
                </div>
              )}

            </div>
          </>
        )}

      </div>
    </div>
  );
};
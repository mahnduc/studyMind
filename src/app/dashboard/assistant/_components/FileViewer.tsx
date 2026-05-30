'use client';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Search, Volume2, BookOpen, Plus, Check, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { useDictionary } from '../../courses/dictionary/useDictionary';

interface FileViewerProps {
  fileName: string;
  onClose?: () => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({ fileName, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [fileLoading, setFileLoading] = useState<boolean>(true);
  const [fileError, setFileError] = useState<string | null>(null);
  const {
    searchTerm,
    setSearchTerm,
    activeWord,
    setActiveWord,
    results,
    loading: dictLoading,
    error: dictError,
    isSaved,
    setIsSaved,
    playAudio,
  } = useDictionary();

  useEffect(() => {
    let isMounted = true;
    async function readFileFromOPFS() {
      if (!fileName) return;
      setFileLoading(true);
      setFileError(null);
      try {
        const root = await navigator.storage.getDirectory();
        const dirHandle = await root.getDirectoryHandle('system-raw-file', { create: false });
        const fileHandle = await dirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const text = await file.text();
        if (isMounted) {
          setContent(text);
          setFileLoading(false);
        }
      } catch (err: any) {
        console.error(`Lỗi khi đọc file ${fileName} từ OPFS:`, err);
        if (isMounted) {
          setFileError(err.message || 'Không thể đọc hoặc file không tồn tại.');
          setFileLoading(false);
        }
      }
    }
    readFileFromOPFS();
    return () => {
      isMounted = false;
    };
  }, [fileName]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (selectedText && selectedText.length > 0 && selectedText.length < 30) {
      const cleanWord = selectedText.replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"']+|[.,\/#!$%\^&\*;:{}=\-_`~()?"']+/g, '');
      if (cleanWord) {
        setSearchTerm(cleanWord);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setActiveWord(searchTerm.trim());
    }
  };

  const handleSaveToCollection = (word: string, data: any) => {
    console.log(`[Collection] Lưu từ "${word}" vào bộ sưu tập:`, data);
    setIsSaved(true);
  };

  if (fileLoading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
        <Loader2 className="w-6 h-6 border-indigo-500 animate-spin" />
        <p className="text-sm font-medium">Đang tải nội dung tài liệu...</p>
      </div>
    );
  }

  if (fileError) {
    return (
      <div className="w-full max-w-2xl mx-auto my-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
        <p className="font-semibold">Lỗi hệ thống khi đọc file:</p>
        <p className="mt-1 text-gray-600 opacity-90">{fileError}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen max-h-screen bg-[#F8FAFC] text-gray-800 antialiased selection:bg-indigo-100 flex flex-col lg:flex-row overflow-hidden">
      <div className="w-full lg:w-[72%] bg-white rounded-none border-r border-gray-100 shadow-2xs overflow-y-auto h-full flex flex-col" onMouseUp={handleTextSelection}>
        <article className="w-full max-w-4xl mx-auto px-6 sm:px-10 py-8 flex-1 min-h-full">
          <header className="mb-8 pb-5 border-b border-gray-100 flex items-center gap-3">
            {onClose && (
              <button onClick={onClose} className="p-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-lg transition-all border border-gray-200/50 shadow-3xs cursor-pointer group shrink-0" title="Quay lại quản lý bài học">
                <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
                <span>{fileName}</span>
                <span className="text-indigo-300">•</span>
                <span className="text-gray-400 normal-case font-medium">Mẹo: Bôi đen từ bất kỳ để tra nhanh</span>
              </div>
            </div>
          </header>
          <div className="w-full">
            {fileName.endsWith('.md') ? (
              <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-gray-950 prose-p:leading-relaxed prose-pre:bg-gray-50 prose-pre:text-gray-800 prose-pre:border prose-pre:border-gray-200/60 prose-img:rounded-2xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            ) : (
              <pre className="font-mono text-xs sm:text-sm leading-relaxed p-6 bg-gray-50 rounded-2xl overflow-x-auto border border-gray-100 text-gray-700 whitespace-pre-wrap break-all">{content}</pre>
            )}
          </div>
        </article>
      </div>
      <div className="w-full lg:w-[28%] bg-[#F8FAFC] flex flex-col h-full overflow-hidden">
        <div className="p-4 bg-white border border-gray-100 rounded-2xl shrink-0 shadow-2xs z-10 m-4 mb-0 sticky top-4">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen size={13} className="text-indigo-500" />
            Tra cứu từ điển
          </h4>
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input type="text" placeholder="Nhập hoặc bôi đen từ mới..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-3 pr-9 py-2 bg-gray-50 text-xs font-semibold rounded-xl border border-gray-200/60 focus:outline-hidden focus:border-indigo-400 focus:bg-white transition-all text-gray-800 placeholder-gray-400" />
            <button type="submit" className="absolute right-1.5 p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer group">
              <Search size={14} className="group-hover:scale-105 transition-transform" />
            </button>
          </form>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {dictLoading && (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-2xs flex-1 flex flex-col items-center justify-center gap-3 min-h-[200px]">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md animate-pulse">
                <Sparkles size={11} />
                Groq AI đang phân tích...
              </div>
            </div>
          )}
          {dictError && !dictLoading && (
            <div className="bg-red-50/60 text-red-600 rounded-2xl p-4 text-[11px] font-semibold border border-red-100/70 leading-normal">
              Không thể kết nối với hệ thống từ điển AI. Vui lòng kiểm tra lại cấu hình hoặc API Key.
            </div>
          )}
          {!dictLoading && !dictError && !results && (
            <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200 text-gray-400 text-[11px] font-medium flex-1 flex flex-col items-center justify-center py-10">
              <p>Chưa có dữ liệu tra cứu.</p>
              <p className="mt-0.5 text-gray-300">Quét một từ ở văn bản bên trái hoặc nhập thủ công.</p>
            </div>
          )}
          {!dictLoading && !dictError && results && results.map((entry, index) => (
            <div key={index} className="w-full bg-white rounded-2xl border border-gray-100 shadow-2xs p-4 flex flex-col gap-3.5 animate-fade-in shrink-0">
              <div className="flex items-center justify-between gap-3 border-b border-gray-50 pb-2.5">
                <div className="min-w-0">
                  <h2 className="text-base font-black text-gray-900 truncate capitalize tracking-tight">{entry.word}</h2>
                  {entry.phonetics?.[0]?.text && <p className="text-[10px] font-mono font-bold text-indigo-600 mt-0.5">{entry.phonetics[0].text}</p>}
                </div>
                <button onClick={() => playAudio(entry.word)} className="p-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-600 rounded-lg transition-all shrink-0 cursor-pointer" title="Phát âm tiếng Mỹ">
                  <Volume2 size={14} />
                </button>
              </div>
              {entry.ai?.refused ? (
                <div className="p-3 bg-amber-50/70 border border-amber-100 text-amber-700 text-[11px] rounded-xl leading-normal">
                  <p className="font-bold">Lưu ý hệ thống:</p>
                  <p className="mt-0.5 opacity-90">{entry.ai.partsOfSpeech[0].definitionVi}</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {entry.ai?.partsOfSpeech?.map((pos, pIdx) => (
                    <div key={pIdx} className="space-y-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <div className="flex">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-sm">{pos.partOfSpeech}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-800 leading-normal">{pos.definitionVi}</p>
                      <p className="text-[11px] font-medium text-gray-400 italic leading-normal">{pos.definitionEn}</p>
                      {pos.examples && pos.examples.length > 0 && (
                        <div className="mt-2 pl-2 border-l-2 border-indigo-50 space-y-1.5">
                          {pos.examples.map((ex, eIdx) => (
                            <div key={eIdx} className="text-[11px] leading-normal">
                              <p className="font-semibold text-gray-600">“{ex.en}”</p>
                              <p className="text-gray-400 mt-0.5">{ex.vi}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button disabled={isSaved} onClick={() => handleSaveToCollection(entry.word, entry)} className={`w-full mt-0.5 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer ${isSaved ? 'bg-emerald-50 text-emerald-600 cursor-not-allowed border border-emerald-100/70' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'}`}>
                {isSaved ? (
                  <>
                    <Check size={12} strokeWidth={3} />
                    Đã lưu vào bộ từ vựng
                  </>
                ) : (
                  <>
                    <Plus size={12} strokeWidth={3} />
                    Lưu vào BST học tập
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};